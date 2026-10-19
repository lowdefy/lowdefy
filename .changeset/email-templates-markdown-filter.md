---
'@lowdefy/email-templates': minor
---

feat(email-templates): Notification templates can render a data value as markdown with the `markdown` filter. `message: "{{ intro }}\n\n{{ body | markdown }}"` keeps `intro` escaped and renders `body` as headings, lists, links and images, for markdown the app wrote itself, such as a release note body. Raw HTML stays escaped in a filtered value, every value without the filter renders as before, and the filter changes nothing in plain properties like `subject`. Rendered images now get `max-width:100%;height:auto;` so they fit the email column.
