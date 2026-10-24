---
'@lowdefy/shell': minor
'@lowdefy/blocks-native': minor
'@lowdefy/build': minor
'@lowdefy/api': minor
'@lowdefy/server-dev': minor
---

feat(mobile): Push and actionable notifications in every shell

Every shell carries expo-notifications. `mobile.notifications` names the API endpoints the shell posts its push token to once signed in (`register`, with `{ token, expoToken, platform, provider, shellId, appVersion }`) and at sign-out (`unregister`), how a notification shows while the app is open (`foreground: banner | silent`), and categories of action buttons. A tap opens `data.path` and fires the `onNotificationAction` app event; a button with `endpointId` (Approve, or Reply with `input`) calls the endpoint without opening the app; `snooze: <minutes>` shows the notification again later. `onNotification` fires for a notification received while the app is open, and a push with `data.refreshWidgets` refreshes the widgets. New actions: `ScheduleNotification`, `CancelNotification`, `SetBadgeCount` and `RequestNotificationPermission`. `lowdefy_device inject` with kind `push` now shows the notification in Lowdefy Dev and can tap it or press a button; an APNs payload with `aps` still goes through `simctl push` on an iOS simulator.
