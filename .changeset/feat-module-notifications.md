---
'@lowdefy/build': minor
'lowdefy': patch
---

feat: Modules can ship notification email templates.

`module.lowdefy.yaml` now accepts a `notifications:` section, so a module that drives a notification flow (like user invites) can ship its own email templates instead of every app hand-writing them. Template ids scope to `{entry}/{id}` — installing the same module twice never collides — and template properties resolve `_module.var`, so email copy can be configured through the module's vars.

The new `_module.notificationId` operator resolves scoped ids in module content (`_module.notificationId: invite-user` in a `RenderNotification` step or dispatch payload) and at the app level with the object form (`{ id: invite-user, module: user-admin }`).

The `lowdefy emails` preview now finds scoped notification artifacts in subdirectories and writes nested preview shims, grouping templates by module entry in the preview sidebar.
