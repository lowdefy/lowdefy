# @lowdefy/plugin-posthog

PostHog product analytics as Lowdefy actions (`PostHogInit`, `PostHogCapture`, `PostHogIdentify`, ...), wrapping the `posthog-js` browser SDK. A default package. User docs: `packages/docs/plugins/PostHog.yaml`.

## State

`src/lib/postHogState.js` is the module singleton every action reads: `status` (`uninitialized`, `disabled`, `loading`, `failed`, `enabled`), `client` (the posthog-js instance), `trace` (the engine's trace registry, set by every `PostHogInit`) and `subscription` (`{ trace, unsubscribe, count }` for the failure listener). `initPostHog` loads posthog-js once per browser session; `loadPostHog` is the only place it is imported, so a disabled app never downloads it.

## Start from the app's events

The docs recommend `PostHogInit` (and `PostHogIdentify`) in the root `events.onInitAsync`, which `getAppContext` single-flights, so it runs once per app load on whichever page opens first. The plugin does not depend on it: `initPostHog` dedupes per session and the failure subscription is keyed to the trace registry, so a per-page placement adds no second listener.

## Enrichment

`loadPostHog` sets `before_send` to `enrichEvent` (YAML options cannot carry a function, so the plugin owns the hook). `enrichEvent` reads `postHogState.trace` and always returns the event:

- `$autocapture`, `$rageclick`, `$dead_click` with `$elements_chain`: `trace.describeChain(chain)` gives `lowdefy_page_id`, `lowdefy_block_id`, `lowdefy_block_type`, `lowdefy_row`, `lowdefy_column`, `lowdefy_block_ids`, `lowdefy_option` (true only). Null, false and empty values are left out; text is not repeated (`$el_text`).
- Every event with a `$current_url` gets `trace.pathEntryOf($current_url)`: `lowdefy_page_id` when it has none, and `lowdefy_path_params` (`{}` for a page without a path pattern) when its page id is the entry's.

`PostHogInit` registers `environment`, `lowdefy_build_id` (`lowdefyApp.buildId`) and `lowdefy_app_version` (`lowdefyApp.version`) as super properties. `~k` config keys are per-build ids, so the build id is what maps `lowdefy_config_key` back to config.

## lowdefy_event_failed

After PostHog is `enabled` and unless `captureEventFailures` is `false` (default `true`, one constant in `PostHogInit.js`), `subscribeEventFailures` subscribes one listener to `trace`. Per payload with `success: false` it captures `lowdefy_event_failed` with `buildFailureProperties(payload)` and `{ timestamp: payload.record.startTimestamp }`, at most 50 per subscription (one app load). It subscribes with `{ replay: true }`, so the failures the registry held before anyone asked for replay (app `onInit`, which `getAppContext` finishes before `onInitAsync` starts, and the first page's `onInit` while posthog-js loads) arrive synchronously inside `trace.subscribe`, before its return value is stored; the listener therefore reads only `subscription.count` and `postHogState.client`, both set before the call. Replayed failures keep their own `startTimestamp` and count against the cap. The same registry is a no-op; a different one replaces the subscription.

## Property contract

The production journey miner reads these names; changing one is a breaking change for captured history:

- Enriched autocapture: `lowdefy_page_id`, `lowdefy_block_id`, `lowdefy_block_type`, `lowdefy_block_ids`, `lowdefy_row`, `lowdefy_column`, `lowdefy_option`.
- Every event: `lowdefy_page_id`, `lowdefy_path_params`. Super properties: `lowdefy_build_id`, `lowdefy_app_version`.
- `lowdefy_event_failed`: `lowdefy_event_scope`, `lowdefy_page_id`, `lowdefy_block_id`, `lowdefy_block_type` (not for `app`), `lowdefy_event_name`, `lowdefy_debounce_ms`, `lowdefy_action_id`, `lowdefy_action_type`, `lowdefy_error_name`, `lowdefy_config_key`, `lowdefy_invalid_blocks` (not when empty).

None carries a message, a typed value or text autocapture does not already send.

## Tests

- Unit: `src/actions/*.test.js` and `src/lib/*.test.js` with a fake trace (`src/test/createFakeTrace.js`).
- Chain round trip: `src/lib/chainRoundTrip.test.js` builds each `@lowdefy/e2e-utils/targets` fixture's chain with the pinned posthog-js `autocapturePropertiesForElement` and checks `targetFromElementsChain` against the fixture target. A posthog-js upgrade that changes the chain fails here. (The engine is not a devDependency: it would close a package cycle through `@lowdefy/build`.)
- e2e: `e2e/` builds an app that runs `PostHogInit` from `events.onInitAsync` with `apiHost: <origin>/ingest`, routes `**/ingest/**` and asserts the events that leave the browser (`pnpm --filter=@lowdefy/plugin-posthog e2e`, port 3018). The spec answers remote config with `autocapture_opt_out: false` (posthog-js keeps autocapture off until it knows the project has not opted out) and the app sets `opt_out_useragent_filter: true` (posthog-js drops headless Chromium as a bot).
