---
'@lowdefy/plugin-posthog': minor
'@lowdefy/engine': minor
'@lowdefy/helpers': minor
'@lowdefy/errors': minor
'@lowdefy/client': patch
'@lowdefy/server-dev': patch
'@lowdefy/blocks-antd': patch
'@lowdefy/e2e-utils': patch
---

feat(plugin-posthog): PostHog events carry Lowdefy semantics

PostHog events now carry Lowdefy semantics. Autocaptured clicks, rage clicks and dead clicks get `lowdefy_page_id`, `lowdefy_block_id`, `lowdefy_block_type`, `lowdefy_block_ids`, `lowdefy_option` on a dropdown option and, inside a grid, `lowdefy_row` and `lowdefy_column`, and every event gets `lowdefy_page_id`. A new `lowdefy_event_failed` event is captured when a block or app event fails, with ids only, never messages or values, and at most 50 per app load. Failures in the app's `onInit` are captured too, although `PostHogInit` runs later in `onInitAsync`. Set `captureEventFailures: false` on `PostHogInit` to turn it off. Action plugins receive a new `trace` argument for observing completed events. Run `PostHogInit` from `events.onInitAsync` so it starts once per app load. AutoComplete and PhoneNumberInput now render their dropdowns inside the block, like Selector.
