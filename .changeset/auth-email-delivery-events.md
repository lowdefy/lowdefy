---
'@lowdefy/api': minor
'@lowdefy/build': patch
'@lowdefy/docs': patch
---

Auth emails now write a wide event, and the monitor that watches them is real. Sending a verification, password-reset, magic-link or invitation email is the one delivery the framework performs itself: it does not pass through the request resolver, so nothing recorded it and a deployment whose SMTP host had gone down looked exactly like one sending mail. That send now emits `notification_delivered` / `notification_failed` carrying `notification_id`, `channel`, `connection_id`, `duration_ms`, `success` and, on a failure, the error, never the recipient address, the subject or the body, and never changing what the send itself returns or throws; a recipient dropped by the connection's delivery filter is marked `filtered` rather than counted as mail that went out. `build/monitors.json` turns each notification wired to `auth.email.templates` into an active rule over that event, keyed on its `notification_id` at your `logger.monitors.defaults.error_rate`, so `pnpm monitors:push` creates a real alert for it instead of skipping it. Notifications your own routines render are unchanged: they stay `covered`, naming the endpoint monitors that already watch the send.
