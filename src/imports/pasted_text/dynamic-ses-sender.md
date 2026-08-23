# Feature Enhancement: Dynamic Amazon SES Sender Management for Ma3moni

## Background

The Ma3moni backend has already been integrated with Amazon SES for transactional email delivery.

Currently, the application uses a single sender email.

I want to upgrade the email system to support **dynamic sender identities** based on the email category while maintaining a clean, scalable, enterprise architecture.

The backend is:

* Django REST Framework
* PostgreSQL
* Hosted on Render
* Frontend is React hosted on Vercel
* Email provider is Amazon SES

The entire domain **ma3moni.com** is already verified in Amazon SES.

Do **not** verify individual email addresses because domain verification already permits sending from any address under the domain.

---

# Objective

Implement a centralized email system that automatically chooses the appropriate sender email and sender name depending on the category of email being sent.

No application code outside the email service should need to know which email address is used.

Business logic should simply specify the email category.

---

# Environment Variables

Replace the existing single sender configuration with the following:

```env
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SES_REGION=eu-west-2

EMAIL_FROM_DEFAULT=notifications@ma3moni.com
EMAIL_FROM_ACCOUNTS=accounts@ma3moni.com
EMAIL_FROM_SECURITY=security@ma3moni.com
EMAIL_FROM_BILLING=billing@ma3moni.com
EMAIL_FROM_SUPPORT=support@ma3moni.com

EMAIL_FROM_NAME=Ma3moni
EMAIL_FROM_ACCOUNTS_NAME=Ma3moni Accounts
EMAIL_FROM_SECURITY_NAME=Ma3moni Security
EMAIL_FROM_BILLING_NAME=Ma3moni Billing
EMAIL_FROM_SUPPORT_NAME=Ma3moni Support
```

---

# Sender Categories

The email service should automatically use the appropriate sender based on the category.

| Category | From Email                                                    | Display Name     |
| -------- | ------------------------------------------------------------- | ---------------- |
| accounts | [accounts@ma3moni.com](mailto:accounts@ma3moni.com)           | Ma3moni Accounts |
| security | [security@ma3moni.com](mailto:security@ma3moni.com)           | Ma3moni Security |
| billing  | [billing@ma3moni.com](mailto:billing@ma3moni.com)             | Ma3moni Billing  |
| support  | [support@ma3moni.com](mailto:support@ma3moni.com)             | Ma3moni Support  |
| default  | [notifications@ma3moni.com](mailto:notifications@ma3moni.com) | Ma3moni          |

---

# Email Service Design

Create a centralized EmailService.

Do not hardcode sender addresses inside business logic.

Business logic should simply specify:

* category
* recipient
* subject
* template
* template context

Example:

```python
EmailService.send(
    category="accounts",
    recipient=user.email,
    template="verification",
    subject="Verify your email",
    context={...}
)
```

The EmailService should automatically determine:

* sender email
* sender display name
* HTML template
* plain text template
* Amazon SES sender identity

---

# Internal Sender Registry

Maintain an internal mapping similar to:

```python
SENDERS = {
    "default": {
        "email": settings.EMAIL_FROM_DEFAULT,
        "name": settings.EMAIL_FROM_NAME,
    },
    "accounts": {
        "email": settings.EMAIL_FROM_ACCOUNTS,
        "name": settings.EMAIL_FROM_ACCOUNTS_NAME,
    },
    "security": {
        "email": settings.EMAIL_FROM_SECURITY,
        "name": settings.EMAIL_FROM_SECURITY_NAME,
    },
    "billing": {
        "email": settings.EMAIL_FROM_BILLING,
        "name": settings.EMAIL_FROM_BILLING_NAME,
    },
    "support": {
        "email": settings.EMAIL_FROM_SUPPORT,
        "name": settings.EMAIL_FROM_SUPPORT_NAME,
    },
}
```

If an unknown category is supplied, automatically fall back to the default sender.

---

# Email Types

Configure the existing email workflows to use the following categories automatically.

## Accounts

* Registration verification
* Welcome email
* Email address change verification
* Profile completion reminders

## Security

* Password reset
* Login alerts
* OTP verification
* Two-factor authentication
* Suspicious login notifications

## Billing

* Subscription confirmation
* Payment receipts
* Renewal reminders
* Invoice emails
* Refund notifications

## Support

* Customer support replies
* Support ticket updates

## Default

* Match notifications
* New messages
* Likes
* Visitor notifications
* General account notifications

---

# Amazon SES Integration

The SES provider should automatically construct the sender.

Example:

```
Source:
Ma3moni Security <security@ma3moni.com>
```

or

```
Source:
Ma3moni Billing <billing@ma3moni.com>
```

No code outside the SES provider should ever build the Source header.

---

# Email Provider Independence

The business logic must never communicate directly with Amazon SES.

Continue using the existing provider abstraction.

Architecture:

```
EmailService
        │
        ▼
BaseEmailProvider
        │
        ├── AmazonSESProvider
        ├── MockEmailProvider
        ├── ResendProvider
        └── MailgunProvider
```

Switching providers must not require any changes to business logic.

---

# Logging

Every email should log:

* email category
* sender email
* sender display name
* recipient
* subject
* provider
* delivery status
* timestamp
* retry count (if applicable)

---

# Testing

Add unit tests covering:

* sender selection by category
* fallback to default sender
* SES Source header generation
* environment variable loading
* unknown category handling
* provider abstraction
* development mode compatibility

---

# Documentation

Document:

* how to add a new sender category
* how to configure sender environment variables
* how to switch email providers
* how to add new email templates
* how the sender selection process works

---

# Requirements

Follow enterprise Django best practices.

Use:

* SOLID principles
* Clean Architecture
* Dependency Injection where appropriate
* Type hints
* Comprehensive docstrings
* Centralized configuration
* Reusable services
* Scalable folder structure
* Production-ready implementation
* Maintain backward compatibility with existing email APIs where possible

Do not generate placeholder code. Implement a complete, maintainable, production-ready solution that integrates seamlessly into the existing Ma3moni backend.
