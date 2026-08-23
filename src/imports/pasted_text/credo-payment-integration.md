# Ma3moni – Clean Credo Payment Gateway Integration

Implement a production-ready Credo payment gateway integration into the existing Ma3moni Django + React application.

The implementation must use the existing Ma3moni authentication, subscription, admin dashboard, payment, and user systems rather than creating duplicate systems.

Credo documentation:

https://docs.credocentral.com/docs

Credo currently supports NGN and USD. Its production API endpoint is `https://api.credocentral.com` and sandbox is `https://api.credodemo.com`.

Credo requires the public key when initializing a transaction and the secret key for server-side verification. Never expose the secret key to the frontend.

---

# 1. Architecture

Use this architecture:

User
→ Ma3moni Subscription Page
→ Django Payment API
→ Credo Initialize Transaction
→ Credo Hosted Checkout
→ Credo Callback/Webhook
→ Django Server-Side Verification
→ Update Payment
→ Activate Subscription

Do NOT implement direct card collection inside Ma3moni.

Use Credo's hosted checkout.

Credo handles:

* Card entry
* Bank transfer
* OTP
* 3D Secure
* Payment processing

Ma3moni should only initialize, redirect, verify, record, and fulfill the payment.

---

# 2. Admin Credo Configuration

Create a Payment Gateway Settings section in the Ma3moni Admin Dashboard.

Add:

Payment Gateway

[Credo]

Environment

[Sandbox]
[Production]

Credo Public Key

[masked/display field]

Credo Secret Key

[masked/password field]

Credo API URL

Automatically determine from environment:

Sandbox:

https://api.credodemo.com

Production:

https://api.credocentral.com

Payment Gateway Status

[Enabled / Disabled]

Default Payment Channels

☑ Card

☑ Bank Transfer

☐ USSD

☐ Wallet

Allow Customer Bearer Fee

[Yes / No]

Save Settings

Test Connection

---

# 3. Security Requirements

The Credo Secret Key MUST NEVER:

* appear in React
* appear in browser JavaScript
* appear in API responses
* appear in page source
* appear in Git
* appear in logs
* be stored in localStorage
* be stored in sessionStorage

The secret key must remain server-side.

The public key may be exposed where necessary because Credo identifies it as the key used for transaction initialization.

Prefer storing the credentials securely in Django/server environment variables.

If the Ma3moni admin UI is allowed to update the credentials, encrypt the secret key at rest and never return the raw secret key through the API.

---

# 4. Environment Variables

Support:

CREDO_ENABLED=True

CREDO_ENVIRONMENT=production

CREDO_API_URL=https://api.credocentral.com

CREDO_PUBLIC_KEY=

CREDO_SECRET_KEY=

CREDO_CALLBACK_URL=

CREDO_WEBHOOK_URL=

CREDO_BEARER=0

CREDO_CHANNELS=CARD,BANK

For sandbox:

CREDO_ENVIRONMENT=sandbox

CREDO_API_URL=https://api.credodemo.com

The admin configuration should override environment defaults where appropriate.

Do not hardcode API keys.

---

# 5. Payment Service

Create a dedicated Django service:

services/payments/credo_service.py

Implement:

CredoPaymentService

Methods:

initialize_payment()

verify_payment()

handle_callback()

handle_webhook()

get_transaction()

test_connection()

The rest of the application must NOT directly call Credo.

All Credo communication must go through this service.

---

# 6. Initialize Payment

When a user clicks:

"Pay with Credo"

the frontend must call Ma3moni's backend.

Example:

POST

/api/payments/credo/initialize/

Request:

{
"plan_id": 123
}

The backend must determine:

* authenticated user
* user's verified country
* applicable currency
* applicable subscription price
* plan
* exact amount
* unique payment reference

Do NOT trust:

* amount from frontend
* currency from frontend
* country from frontend
* plan price from frontend

The backend must calculate these values.

---

# 7. Currency Selection

Use the Ma3moni country-based pricing system.

Nigeria:

NGN

Outside Nigeria:

USD

Example:

Premium Plan:

Nigeria:

₦5,000

United Kingdom:

$5

Do NOT convert using exchange rates.

NGN and USD are independent prices.

The backend determines the currency.

---

# 8. Lowest Currency Unit

Credo requires amounts in the lowest currency unit.

NGN:

₦5,000

send:

500000

USD:

$5

send:

500

Implement a reusable utility:

to_credo_amount(amount, currency)

Examples:

to_credo_amount(5000, "NGN")
→ 500000

to_credo_amount(5, "USD")
→ 500

Never use floating point arithmetic for monetary calculations.

Use Decimal.

---

# 9. Credo Initialization Request

Call:

POST

/transaction/initialize

using the configured Credo API URL.

Header:

Authorization: CREDO_PUBLIC_KEY

Content-Type: application/json

Payload:

{
"amount": 500000,
"email": "[customer@example.com](mailto:customer@example.com)",
"currency": "NGN",
"reference": "MA3MONI-...",
"callbackUrl": "...",
"channels": [
"CARD",
"BANK"
],
"bearer": 0,
"initializeAccount": 0,
"customerFirstName": "...",
"customerLastName": "...",
"customerPhoneNumber": "...",
"narration": "Ma3moni Premium Subscription",
"metadata": {
"plan_id": "...",
"user_id": "...",
"subscription_id": "...",
"currency": "...",
"country": "..."
}
}

Credo returns an authorization URL.

Return ONLY the required safe information to the frontend:

{
"success": true,
"authorization_url": "...",
"reference": "..."
}

Never return the secret key.

---

# 10. Redirect to Credo

After successful initialization:

window.location.href = authorization_url

The customer completes payment on Credo's hosted checkout.

Do not create a Ma3moni card payment form.

---

# 11. Payment Record

Create or extend the existing payment model.

Recommended fields:

id

user

subscription_plan

subscription

reference

credo_reference

amount

currency

country

status

gateway

gateway_response

customer_email

created_at

updated_at

paid_at

failure_reason

metadata

gateway should contain:

credo

Statuses:

pending

successful

failed

cancelled

refunded

Do not activate a subscription merely because the user reaches the callback URL.

---

# 12. Callback

Create:

GET/POST

/api/payments/credo/callback/

The callback should receive the Credo transaction reference.

Example:

/api/payments/credo/callback/?transRef=vs_xxxxxxxxx

Do not trust the callback as proof of payment.

Use the callback only to identify the transaction.

Then call:

Credo verification endpoint.

---

# 13. Server-Side Verification

Verify the transaction using the Credo SECRET KEY.

Endpoint:

GET

/transaction/{transRef}/verify

Header:

Authorization: CREDO_SECRET_KEY

Before activating a subscription verify:

1. Credo status indicates successful payment.
2. Transaction reference matches the Ma3moni payment.
3. Business reference matches the Ma3moni reference.
4. Currency matches expected currency.
5. Amount matches expected amount.
6. User/payment record exists.
7. Payment has not already been processed.

Only after all checks pass:

payment.status = successful

subscription.status = active

payment.paid_at = now()

---

# 14. Idempotency / Duplicate Protection

This is extremely important.

A successful Credo transaction must never activate a subscription twice.

Before processing:

if payment.status == successful:

return already_processed

Also ensure:

credo_reference

is unique.

Ensure:

reference

is unique.

Use database transactions and appropriate locking when finalizing payments.

---

# 15. Webhooks

Implement a Credo webhook endpoint.

Example:

POST

/api/payments/credo/webhook/

Process successful and failed transaction events.

Verify webhook authenticity using the Credo secret key according to the current Credo documentation.

Do not activate subscriptions from an unverified webhook.

The system should support both:

Callback

AND

Webhook

The webhook is the reliable server-side notification mechanism.

The callback is primarily for returning the customer to Ma3moni.

---

# 16. Payment Success Page

Create:

Payment Successful

Show:

✓ Payment Successful

Premium Plan

Amount:

₦5,000

Currency:

NGN

Reference:

MA3MONI-XXXXXX

Subscription:

Active

Button:

Continue to Ma3moni

Do not rely solely on frontend state.

The page should retrieve payment status from the backend.

---

# 17. Payment Pending Page

If payment has not yet been verified:

Payment Processing

"Your payment is being confirmed."

Show:

Reference

Amount

Currency

Plan

Provide:

Refresh Payment Status

The frontend can poll:

GET

/api/payments/{reference}/status/

Do not activate the subscription until backend verification confirms payment.

---

# 18. Payment Failed Page

Display:

Payment Failed

We could not confirm your payment.

Reference

Reason if safe to display

Buttons:

Try Again

Back to Plans

---

# 19. Admin Payment Dashboard

Create a comprehensive Payment Dashboard.

Summary cards:

NGN Revenue

₦3,250,000

USD Revenue

$12,500

NGN Transactions

650

USD Transactions

310

Successful Payments

Pending Payments

Failed Payments

Refunded Payments

Active Subscriptions

---

# 20. Currency Segregation

Never combine NGN and USD into one revenue number.

Display:

NGN Revenue

₦3,250,000

USD Revenue

$12,500

Do NOT display:

Total Revenue = ₦5,000,000

because NGN and USD cannot be meaningfully combined without a defined conversion rate.

---

# 21. Payment Table

Columns:

Reference

Customer

Plan

Country

Currency

Amount

Credo Reference

Status

Date

Actions

Filters:

Currency:

All

NGN

USD

Country:

All

Nigeria

United Kingdom

Other

Status:

All

Successful

Pending

Failed

Refunded

Date:

Today

7 Days

30 Days

This Year

---

# 22. Plan Pricing

Each subscription plan must have independent pricing.

Example:

Premium

Nigeria:

₦5,000

International:

$5

The system must NOT calculate:

USD = NGN exchange rate

or:

NGN = USD exchange rate.

Admin manually determines both prices.

---

# 23. Admin Plan Editor

Add:

Nigeria Price (NGN)

[5000]

International Price (USD)

[5]

The administrator can independently modify either value.

Example:

Nigeria:

₦5,000

International:

$7

This is valid.

Changing NGN pricing must not change USD pricing.

---

# 24. Payment Gateway Settings

Add a section:

Payment Gateway

Credo

Status:

● Connected

Environment:

Production

Public Key:

0PUB••••••••

Secret Key:

••••••••••••

[Update Credentials]

[Test Connection]

[Test Payment]

[Disable Credo]

Never display the complete secret key after saving.

---

# 25. Test Connection

The admin should have:

[Test Credo Connection]

The backend should verify that:

* API URL is reachable
* credentials are valid
* environment is correct

Display:

✓ Credo connection successful

or

✕ Credo connection failed

Show only a safe error message.

Never expose the secret key.

---

# 26. Sandbox / Production

Support separate configurations.

Sandbox:

https://api.credodemo.com

Production:

https://api.credocentral.com

The administrator must be clearly warned before switching to Production:

"Production mode processes real payments."

Require confirmation.

---

# 27. Payment Logs

Create an admin-only payment log.

Log:

Timestamp

Operation

Reference

Credo Reference

Currency

Amount

Status

HTTP Status

Response Code

User

Environment

Do NOT log:

Secret Key

Full card information

CVV

PIN

OTP

Sensitive credentials

---

# 28. Error Handling

Handle:

Invalid API credentials

Invalid currency

Invalid amount

Credo unavailable

Timeout

Duplicate transaction

Payment declined

Payment pending

Invalid callback

Verification failure

Currency mismatch

Amount mismatch

Unknown transaction

Display user-friendly errors.

Example:

"Payment could not be initialized. Please try again."

Do not expose raw Credo API errors to customers.

Store detailed technical errors in server logs.

---

# 29. API Endpoints

Create:

POST
/api/payments/credo/initialize/

GET
/api/payments/credo/callback/

POST
/api/payments/credo/webhook/

GET
/api/payments/{reference}/status/

GET
/api/admin/payments/

GET
/api/admin/payments/summary/

GET
/api/admin/payments/revenue/

PUT
/api/admin/payment-settings/credo/

POST
/api/admin/payment-settings/credo/test/

---

# 30. Frontend Components

Create reusable components:

CredoPaymentButton

PaymentStatus

PaymentSuccess

PaymentFailed

PaymentPending

PaymentSummary

PaymentMethodSelector

CredoSettings

PaymentDashboard

RevenueSummary

PaymentTransactionTable

CurrencyFilter

PricingEditor

---

# 31. User Experience

Subscription page:

Premium

Perfect for serious relationship seekers.

Nigeria:

₦5,000

[Pay with Credo]

For international users:

Premium

Perfect for serious relationship seekers.

$5

[Pay with Credo]

Do not display both prices to the customer unless the design specifically requires it.

---

# 32. Backend Source Structure

Use a clean structure similar to:

services/
payments/
**init**.py
base.py
credo_service.py
pricing_service.py
payment_service.py
currency.py
exceptions.py

apps/
subscriptions/
models.py
services.py
views.py
serializers.py

```
payments/
    models.py
    views.py
    serializers.py
    urls.py
    admin.py

admin_panel/
    ...
```

Keep Credo-specific code isolated from subscription business logic.

---

# 33. Abstract Payment Gateway

Create:

BasePaymentProvider

with:

initialize_payment()

verify_payment()

handle_webhook()

get_transaction()

Then implement:

CredoPaymentProvider

This makes it possible to add another gateway later without rewriting Ma3moni subscriptions.

Potential future providers:

Paystack

Flutterwave

Stripe

---

# 34. Do Not Trust Frontend Pricing

This rule is mandatory.

The frontend may send:

plan_id

But it must NOT be trusted for:

amount

currency

country

payment reference

subscription duration

The backend determines all financial values.

---

# 35. Example Flow

Nigeria user:

User selects Premium.

Backend determines:

country = NG

currency = NGN

price = 5000

Credo amount = 500000

Credo receives:

currency = NGN

amount = 500000

User pays.

Credo redirects to Ma3moni.

Backend verifies payment.

Subscription becomes active.

---

International user:

User selects Premium.

Backend determines:

country = GB

currency = USD

price = 5

Credo amount = 500

Credo receives:

currency = USD

amount = 500

User pays.

Backend verifies payment.

Subscription becomes active.

---

# 36. Admin Revenue Example

Dashboard:

REVENUE

NGN

₦3,250,000

650 successful transactions

USD

$12,500

310 successful transactions

Do not convert one currency into the other.

Provide separate charts:

NGN Revenue

USD Revenue

---

# 37. Testing

Create automated tests for:

NGN pricing

USD pricing

Nigeria country detection

International country detection

Credo amount conversion

NGN kobo conversion

USD cent conversion

Credo initialization

Invalid API key

Credo timeout

Successful payment

Failed payment

Pending payment

Currency mismatch

Amount mismatch

Duplicate payment

Duplicate webhook

Callback without verification

Already processed payment

Subscription activation

Admin credential updates

Sandbox configuration

Production configuration

---

# 38. Important Credo API Rules

Follow the current Credo API documentation rather than inventing custom request formats.

Credo currently expects transaction amounts in the lowest currency unit:

NGN → Kobo

USD → Cents

Credo's initialization endpoint is:

POST /transaction/initialize

Transaction initialization uses the public key.

Transaction verification uses the secret key.

Always verify payment server-side before fulfilling the subscription.

Use Credo's hosted checkout rather than collecting card details directly.

---

# 39. Deliverables

Implement all required frontend screens, Django backend services, API endpoints, models, serializers, admin interfaces, payment flow, validation, logging, error handling, and automated tests.

Do not create a mock-only UI.

The generated code must integrate with the existing Ma3moni Django backend and existing subscription system.

Before creating new models or APIs, inspect the existing Ma3moni codebase and reuse existing:

* User model
* Country/profile information
* Subscription models
* Plan models
* Payment models if available
* Admin authentication
* Platform settings
* Notification system

Avoid duplicate models or duplicate payment logic.

The final implementation must be production-ready and secure.
