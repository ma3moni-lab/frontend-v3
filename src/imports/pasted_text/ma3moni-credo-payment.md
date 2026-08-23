# Ma3moni – Multi-Currency Subscription & Payment System (Credo Integration)

Implement a complete multi-currency subscription and payment architecture for the Ma3moni platform using **Credo** as the payment gateway. The platform will primarily serve users in **Nigeria** and the **United Kingdom**, with support for additional international users in the future.

The objective is to provide an intelligent subscription system where pricing is determined by the user's country while allowing administrators to independently manage Nigerian (NGN) and International (USD) pricing.

## Core Business Rules

1. The payment gateway is Credo.
2. Credo must support payments in both:

   * Nigerian Naira (NGN)
   * United States Dollar (USD)
3. Users located in Nigeria pay in NGN.
4. Users located outside Nigeria pay in USD.
5. Pricing must NOT be determined by exchange rates.
6. NGN and USD prices are completely independent.
7. Administrators can configure each currency separately.

Example:

Premium Plan

* Nigeria Price:

  * ₦5,000

* International Price:

  * $5.00

Even if exchange rates make these values unequal, the system must charge exactly the configured amount.

---

# Country Detection

Determine user currency using the following priority:

1. Verified country stored in the user profile.
2. User-selected country during registration.
3. Phone country code.
4. Browser/IP geolocation.
5. Device location (if permission granted).

Currency rules:

If country == Nigeria

Currency = NGN

Else

Currency = USD

Users cannot manually change their billing currency.

---

# Subscription Plan Management

Redesign the Admin Subscription Plans page.

Each subscription plan should contain:

* Plan Name
* Description
* Duration
* Features
* Badge
* Status
* Sort Order

Pricing Section

Nigeria

* Price (NGN)
* Currency Label (₦)

International

* Price (USD)
* Currency Label ($)

Example

Basic

NGN Price

₦2,000

USD Price

$2

Premium

NGN Price

₦5,000

USD Price

$5

VIP

NGN Price

₦10,000

USD Price

$10

Prices are edited independently.

Changing one currency must never affect the other.

---

# User Subscription Page

When viewing subscription plans:

If user country is Nigeria

Display:

Premium

₦5,000

Pay with Credo

If user country is UK

Display:

Premium

$5

Pay with Credo

The user should never see the hidden currency.

---

# Checkout

Checkout page should display:

Selected Plan

Billing Currency

Country

Amount

Payment Gateway

Example

Premium Plan

Country

Nigeria

Currency

NGN

Amount

₦5,000

Pay Securely with Credo

Another example

Premium Plan

Country

United Kingdom

Currency

USD

Amount

$5.00

Pay Securely with Credo

---

# Credo Payment Flow

During payment initialization send:

Amount

Currency

Customer Email

Customer Name

Reference

Subscription Plan

Country

Metadata

Ensure Credo receives either:

Currency = NGN

or

Currency = USD

depending on the user's country.

Never perform automatic currency conversion.

---

# Payment History

Each payment record must include:

Payment Reference

User

Country

Currency

Amount

Payment Method

Gateway Status

Subscription Plan

Date

Admin should immediately identify:

₦ payments

$

payments

---

# Admin Dashboard

Redesign the Payments Dashboard.

Include summary cards:

Total Revenue (NGN)

Total Revenue (USD)

Today's NGN Revenue

Today's USD Revenue

Monthly NGN Revenue

Monthly USD Revenue

Successful Payments

Failed Payments

Pending Payments

Refunded Payments

Active Subscriptions

Expired Subscriptions

Cancelled Subscriptions

---

# Revenue Analytics

Create separate charts.

Chart 1

NGN Revenue

Daily

Weekly

Monthly

Yearly

Chart 2

USD Revenue

Daily

Weekly

Monthly

Yearly

Never combine both currencies into one revenue total.

---

# Payment Table

Columns

Reference

Customer

Country

Currency

Amount

Plan

Status

Gateway

Created Date

Add filters

Currency

NGN

USD

Country

Nigeria

United Kingdom

Others

Status

Success

Pending

Failed

Refunded

---

# Revenue Summary

Display separate totals.

Example

NGN Revenue

₦3,250,000

USD Revenue

$12,500

Total NGN Transactions

650

Total USD Transactions

310

Average NGN Payment

₦5,000

Average USD Payment

$5

---

# Admin Settings

Create a Pricing Configuration page.

Each plan should allow editing:

Plan Name

Nigeria Price

USD Price

Currency Labels

Visibility

Active/Inactive

Display Order

Saving prices should immediately affect all future checkouts.

Existing subscriptions remain unchanged.

---

# Future Scalability

Design the pricing architecture so additional currencies can be added later.

Example future support:

EUR

GBP

CAD

AUD

The UI and backend should use a flexible currency model instead of hardcoding only NGN and USD.

---

# Reports

Provide downloadable reports.

NGN Revenue Report

USD Revenue Report

Combined Transaction Report

Subscription Sales Report

CSV

Excel

PDF

---

# Security

Prevent users from manipulating the currency through URLs, APIs, browser developer tools, or request payloads.

The backend must always determine the correct billing currency using the authenticated user's verified country.

---

# UI Requirements

Use a premium SaaS admin dashboard design.

Display currency badges using distinct visual styles.

Show country flags beside transactions.

Use responsive tables and analytics.

Provide clean cards for revenue summaries.

Maintain consistency with the existing Ma3moni design system.

---

# Backend Architecture Requirements

Generate Django-compatible backend architecture alongside the UI.

Implement:

* Country-based pricing resolver.
* Dynamic subscription pricing service.
* Multi-currency Credo payment service.
* Separate NGN and USD transaction records.
* Revenue aggregation service grouped by currency.
* Currency-aware subscription APIs.
* Admin APIs for independent NGN/USD pricing.
* Payment analytics APIs with separate currency summaries.
* Extensible currency model for future currencies without requiring major database redesign.

The generated solution should be production-ready, scalable, secure, and fully integrated with the existing Ma3moni authentication, subscription, payment, and admin systems.
