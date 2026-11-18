---
'@lowdefy/plugin-posthog': patch
---

fix(deps): Update posthog-js to 1.447.12

posthog-js 1.447.12 adds the `defaults: 'latest'` option, support chat theming and open/close methods, and `$input_value` capture for fields marked `data-ph-capture-value`. It fixes UUID generation breaking capture when `crypto.getRandomValues` throws, stops arrow controls in carousels from producing false rage clicks, sanitises web experiment HTML, and releases removed shadow DOM hosts from session replay memory.
