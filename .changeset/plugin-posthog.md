---
'@lowdefy/plugin-posthog': minor
'@lowdefy/engine': minor
'@lowdefy/helpers': minor
'@lowdefy/errors': minor
'@lowdefy/client': patch
'@lowdefy/server-dev': patch
'@lowdefy/blocks-antd': patch
'@lowdefy/e2e-utils': patch
'lowdefy': minor
---

feat(plugin-posthog): new PostHog product analytics plugin

A default plugin that wraps the `posthog-js` browser SDK, so no script tag or snippet is
needed. `posthog-js` is loaded lazily by `PostHogInit`, so an app with `enabled: false`
never downloads it. Run `PostHogInit` from the app's root `events.onInitAsync`, which runs
once per app load on whichever page opens first; repeat calls with the same `apiKey` do nothing.

Adds `PostHogInit`, `PostHogCapture`, `PostHogPageview`, `PostHogCapturePageLeave`,
`PostHogIdentify`, `PostHogSetPersonProperties`, `PostHogAlias`, `PostHogGroup`,
`PostHogReset`, `PostHogOptIn`, `PostHogOptOut`, `PostHogFeatureFlag` and
`PostHogReloadFeatureFlags`, each with a params schema.

With PostHog disabled every other action is a silent no-op, so analytics can never break an
app, but invalid params still throw and an action that runs before `PostHogInit` logs a
console warning. `PostHogIdentify` reads the identity `posthog-js` holds and resets before
identifying a different person on a shared browser.

- **Lowdefy semantics** — every event gets `lowdefy_page_id` (the page id, also on a page with a
  path pattern) and `lowdefy_path_params` (the page's path values, `{}` without a pattern).
  Autocaptured clicks, rage clicks and dead clicks also get `lowdefy_block_id`,
  `lowdefy_block_type`, `lowdefy_block_ids`, `lowdefy_option` on a dropdown option, `lowdefy_row`
  and `lowdefy_column` inside a grid, and `lowdefy_text`: the text of the control the click
  reached (a button, menu item, option or label), even when the click lands on its icon, a child
  or a wrapper.
- **Event failures** — a `lowdefy_event_failed` event is captured when a block or app event fails,
  with ids only, never messages or values, and at most 50 per app load. Failures in the app's
  `onInit` are captured too, although `PostHogInit` runs later in `onInitAsync`. Set
  `captureEventFailures: false` on `PostHogInit` to turn it off.
- **Click text masking** — on by default. Click text (`$el_text`, `lowdefy_text`, `text` entries in
  `$elements_chain` and `$elements`, `$selected_content` and link targets) is kept only when the
  config of the page it was clicked on, the menus, the i18n messages or the antd locale spell it
  out. Grid and table cell values, options and menu items filled by requests, labels built from
  records and `Dynamic` block output are removed; button, menu, tab, column header and literal
  option labels stay. Element attributes other than structural ones (tag, classes, `class`,
  `role`, `type`, `row-index`, `col-id`, `nth-child`, `nth-of-type`) are removed, including
  `title`, `aria-label` and `data-*`, and `id` is kept only as a block wrapper id. Classes and
  `data-ph-capture-attribute-*` values are not masked, so apps must not build them from data. URLs
  are not masked. Set `maskDataText: false` on `PostHogInit` to send full click text, or
  `options.mask_all_text: true` to send none.
- **Deployment environments** — `PostHogInit` registers the current environment as the
  `environment` super property on every event, and `posthog.enabled: false` in an environment
  turns PostHog off there (`PostHogInit` behaves as `enabled: false`), alongside the `cron`,
  `email` and `sentry` switches.

For plugin authors: action plugins receive a `trace` argument for observing completed events and
the read-only app metadata as `lowdefyApp`; the engine trace gains `isConfigText({ text, pageId })`,
and `@lowdefy/helpers` exports `filterElementsChain`.

AutoComplete and PhoneNumberInput render their dropdowns inside the block, like Selector.
