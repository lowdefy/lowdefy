---
'@lowdefy/docs': patch
---

Fix the Notifications concepts docs page failing to render: its markdown is interpolated with Nunjucks, and the `{% if %}` example on the page broke template parsing. The page content is now escaped with `{% raw %}` so the notification template examples render as written.
