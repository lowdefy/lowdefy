---
'@lowdefy/engine': patch
'@lowdefy/plugin-posthog': minor
---

feat(plugin-posthog): Analytics events on a patterned page name the page and carry its path values

The trace registry reads the page of a URL from the path memory, so events on `/tickets/s/1` carry `lowdefy_page_id: 'ticket'` instead of the path, and the block type is read from the page instance the URL shows. PostHog events gain `lowdefy_path_params`, the path values of the page (`{}` for a page without a path pattern).
