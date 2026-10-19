---
'@lowdefy/plugin-posthog': minor
'lowdefy': patch
---

PostHog click events carry `lowdefy_text`, the text of the control a click reached (a button, menu item, option or label), even when the click lands on its icon, a child or a wrapper, where `$el_text` holds only the clicked element's own text. It is masked exactly like `$el_text`: with `maskDataText` on (the default) it is sent only when it is config text. `lowdefy journeys pull posthog` tokenises `lowdefy_text`, falling back to `$el_text` for events captured before the change, so production clicks match the text the dev recorder reads.
