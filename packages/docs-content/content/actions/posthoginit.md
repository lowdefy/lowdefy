# PostHogInit

```
(params: {
  apiKey?: string,
  apiHost?: string,
  options?: object,
  debug?: boolean,
  enabled?: boolean,
  captureEventFailures?: boolean,
}): Promise<null>
```

The `PostHogInit` action downloads and initialises the [PostHog](https://posthog.com) `posthog-js` browser SDK. Every other PostHog action does nothing until it has run, so run it from the app's root `events.onInitAsync` in `lowdefy.yaml`, which runs once per app load on whichever page opens first and does not hold the first render.

`PostHogInit` is idempotent: the first call loads PostHog, and later calls with the same `apiKey` do nothing, so running it from every page's events instead is also safe. Calling it with a different `apiKey` throws, because a second PostHog instance would split the session. With `enabled: false`, `posthog-js` is never downloaded and every other PostHog action becomes a silent no-op. A later call with `enabled: true` still loads PostHog; a call with `enabled: false` after PostHog was loaded throws.

Every event carries the deployment environment: when the app declares [`config.environments`](/lowdefy-schema), `PostHogInit` registers the current environment's name (`LOWDEFY_ENVIRONMENT`) as the `environment` super property, so staging and production events can be told apart in one PostHog project. It also registers `lowdefy_build_id` and `lowdefy_app_version` (the app's `version`), so events can be split before and after a deploy, and a `lowdefy_config_key` can be mapped back to the config of the build that sent it.

Events carry Lowdefy semantics. Autocaptured clicks, rage clicks and dead clicks get `lowdefy_page_id`, `lowdefy_block_id`, `lowdefy_block_type`, `lowdefy_block_ids` (every enclosing block, innermost first), `lowdefy_option: true` on a dropdown option and, inside a grid, `lowdefy_row` and `lowdefy_column`. Every other event gets `lowdefy_page_id`. This adds properties only, never events, and has no switch. A block with the `ph-no-capture` class is not autocaptured, so it is never enriched.

When a block or app event fails, `PostHogInit` captures a `lowdefy_event_failed` event with `lowdefy_event_scope` (`page` or `app`), `lowdefy_page_id`, `lowdefy_block_id`, `lowdefy_block_type`, `lowdefy_event_name`, `lowdefy_debounce_ms`, `lowdefy_action_id`, `lowdefy_action_type`, `lowdefy_error_name`, `lowdefy_config_key` and `lowdefy_invalid_blocks` (the blocks a `Validate` found invalid). It carries ids only, never error messages or values, and is timestamped when the event's actions started. Failures in the app's `onInit` and in the first page's `onInit` are captured too, although `PostHogInit` runs later in `onInitAsync`: Lowdefy holds up to 20 failures until PostHog starts. At most 50 are captured per app load, held failures included. Set `captureEventFailures: false` to turn it off.

An environment with `posthog: { enabled: false }` in `config.environments` switches PostHog off there: `PostHogInit` behaves as `enabled: false` whatever its params say, needs no `apiKey`, and every other PostHog action is a no-op.

If `posthog-js` fails to download, for example on a flaky network, a warning is logged to the browser console and the other PostHog actions do nothing.

The action is part of the [`@lowdefy/plugin-posthog`](/PostHog) plugin, which is included by default. See the [PostHog guide](/PostHog) for how the actions fit together.

#### Parameters

###### object
  - `apiKey: string`: __Required__ unless `enabled` is `false` - The PostHog project API key. This is a public, write only key that is meant to ship in the browser bundle, so read it with [`_build.env`](/_build). Never use a personal API key here.
  - `apiHost: string`: The PostHog ingestion host. Defaults to `https://us.i.posthog.com`. Use `https://eu.i.posthog.com` for the EU cloud, or the host of a self hosted instance.
  - `options: object`: Passed through to `posthog.init` as its config object. Set `capture_pageview: history_change` to capture a pageview on every client side navigation. Other common options are `person_profiles`, `capture_pageleave`, `autocapture`, `disable_session_recording`, `persistence` and `opt_out_capturing_by_default`. See the [posthog-js config reference](https://posthog.com/docs/libraries/js/config).
  - `debug: boolean`: Log everything PostHog does to the browser console.
  - `enabled: boolean`: Set to `false` to skip loading PostHog. Defaults to `true`.
  - `captureEventFailures: boolean`: Capture a `lowdefy_event_failed` event when a block or app event fails. Defaults to `true`.

#### Response

`null`, once `posthog-js` has loaded.

#### Examples

###### Initialise PostHog once per app load:
```yaml
# lowdefy.yaml
events:
  onInitAsync:
    _ref: shared/posthog_init.yaml
```

```yaml
# shared/posthog_init.yaml
- id: init_posthog
  type: PostHogInit
  params:
    apiKey:
      _build.env: POSTHOG_API_KEY
    enabled:
      _build.ne:
        - _build.env: POSTHOG_API_KEY
        - null
    options:
      capture_pageview: history_change
      person_profiles: identified_only
```

With `POSTHOG_API_KEY` unset, for example in local development, `enabled` is `false` and PostHog is never loaded.

###### Turn off the failure event:
```yaml
- id: init_posthog
  type: PostHogInit
  params:
    apiKey:
      _build.env: POSTHOG_API_KEY
    captureEventFailures: false
```
