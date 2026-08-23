You are a Senior Full Stack Software Architect and Principal Engineer.

Analyze the ENTIRE existing Ma3moni codebase before making any changes. Do NOT regenerate existing functionality. Reuse, refactor, and extend the current architecture wherever possible.

Project Stack:
- Frontend: React + Vite + TypeScript
- Backend: Django + Django REST Framework
- Authentication: JWT (SimpleJWT)
- Database: PostgreSQL
- Media Storage: Cloudinary
- PWA already implemented
- Application is already LIVE in production
- Existing notification system may already exist and should be enhanced rather than replaced.

OBJECTIVE

Implement a complete production-ready Push Notification System that works seamlessly across:

- Android installed PWAs
- iOS installed PWAs (iOS 16.4+)
- Chrome
- Edge
- Firefox
- Desktop browsers supporting Web Push

The implementation must be fully integrated into the existing application with no duplicated logic.

====================================================
STEP 1 – ANALYZE EXISTING PROJECT
====================================================

Inspect and document:

- Existing notification models
- Existing services
- Existing APIs
- Existing service worker
- Existing PWA configuration
- Existing settings pages
- Existing messaging system
- Existing match system
- Existing admin dashboard
- Existing authentication flow
- Existing websocket implementation if available

Reuse existing components whenever possible.

====================================================
STEP 2 – IMPLEMENT WEB PUSH
====================================================

Implement browser push notifications using:

- Service Workers
- Push API
- Notifications API
- VAPID Keys
- pywebpush

Generate VAPID keys if missing.

Store them securely using environment variables.

====================================================
STEP 3 – DJANGO BACKEND
====================================================

Implement:

PushSubscription model

Fields:

- user
- endpoint
- p256dh
- auth
- browser
- operating_system
- device_type
- user_agent
- active
- created_at
- updated_at

Support unlimited devices per user.

Automatically deactivate invalid subscriptions.

Create REST endpoints:

POST /api/push/subscribe/

DELETE /api/push/unsubscribe/

GET /api/push/status/

POST /api/push/test/

Implement reusable NotificationService:

send_to_user()

send_to_users()

broadcast()

schedule()

cancel()

Retry failed deliveries.

Log delivery results.

Use Celery for asynchronous delivery.

====================================================
STEP 4 – EVENT INTEGRATION
====================================================

Automatically send push notifications for:

New Match

New Message

Message Read

Profile Like

Profile View

Interest Accepted

Interest Declined

Verification Approved

Verification Rejected

Subscription Activated

Subscription Expiring

Payment Successful

Password Changed

Login From New Device

Account Suspended

Admin Broadcast

Support Reply

Referral Bonus

System Maintenance

Security Alert

Use Django signals where appropriate.

====================================================
STEP 5 – FRONTEND
====================================================

Implement:

NotificationProvider

useNotifications()

NotificationBell

NotificationBadge

NotificationDropdown

NotificationCenter

NotificationSettings

PermissionModal

Notification History

Notification Preferences

Notification Filters

Unread Count

Real-time Updates

Deep Linking

Mark as Read

Delete Notification

Mark All Read

Infinite Scroll

Offline Queue

Automatic Re-subscription

Background Sync

====================================================
STEP 6 – SETTINGS
====================================================

Allow users to enable/disable:

Push Notifications

Messages

Matches

Likes

Views

Verification

Payments

Subscriptions

Security Alerts

Promotions

Announcements

Quiet Hours

Notification Sound

Vibration

====================================================
STEP 7 – PWA
====================================================

Ensure the Service Worker supports:

push

notificationclick

notificationclose

background sync

offline cache

cache updates

versioning

====================================================
STEP 8 – ADMIN
====================================================

Create admin pages for:

Notification Templates

Broadcast Notifications

Notification Analytics

Delivery Logs

Failed Deliveries

Active Devices

User Subscriptions

====================================================
STEP 9 – SECURITY
====================================================

Protect all endpoints.

Validate ownership.

Prevent duplicate subscriptions.

Handle expired VAPID keys.

Remove invalid subscriptions automatically.

Follow OWASP best practices.

====================================================
STEP 10 – TESTING
====================================================

Create:

Unit Tests

Integration Tests

API Tests

Frontend Tests

End-to-End Tests

Provide a "Send Test Notification" feature for authenticated users.

====================================================
STEP 11 – DOCUMENTATION
====================================================

Generate:

Architecture documentation

API documentation

Environment variable documentation

Deployment guide

Testing guide

Troubleshooting guide

====================================================
IMPORTANT REQUIREMENTS
====================================================

1. Do NOT break any existing feature.

2. Do NOT redesign the UI.

3. Reuse existing components.

4. Follow the project's coding style.

5. Ensure backward compatibility.

6. Produce production-ready code.

7. Update all required models, serializers, views, URLs, services, migrations, admin, frontend, and settings.

8. Configure everything so that after deployment, push notifications work immediately on the live production environment.

9. At the end, provide a deployment checklist and a list of every file created or modified.