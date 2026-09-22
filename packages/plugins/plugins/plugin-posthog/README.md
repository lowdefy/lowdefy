# @lowdefy/plugin-posthog

PostHog product analytics for Lowdefy apps: initialise `posthog-js`, capture events, identify people and groups, manage consent and read feature flags.

This package is included in Lowdefy by default; the `posthog-js` SDK is only bundled into an app that uses one of its actions.

`posthog-js` is imported as a module and bundled with the app, so no script tag or reverse proxy setup is needed.

## Initialising

`PostHogInit` must run before any other action in this package. The app level `events.onInit` is the right place: it runs once per browser session, before any page renders.

```yaml
# lowdefy.yaml
events:
  onInit:
    - id: init_posthog
      type: PostHogInit
      params:
        apiKey:
          _build.env: POSTHOG_API_KEY
        apiHost: https://us.i.posthog.com
        enabled:
          _not:
            _eq:
              - _build.env: LOWDEFY_BUILD_ENVIRONMENT
              - development
        options:
          capture_pageview: false
          person_profiles: identified_only
```

The PostHog project API key is a public, write only key that is meant to ship in the browser bundle, so `_build.env` is the right operator for it. Never use a personal API key here.

`PostHogInit` is idempotent: calling it again with the same `apiKey` does nothing, and calling it with a different `apiKey` throws. With `enabled: false` PostHog is never loaded and every other action in this package becomes a silent no-op, which is the usual setup for local development.

## Never breaks the app

Analytics must never break an app, so every action other than `PostHogInit` does nothing and returns `null` when `PostHogInit` has not run or PostHog is disabled. `PostHogFeatureFlag` returns its configured `default` instead, so flag driven config keeps working with PostHog switched off.

## No personal data

Never send personally identifiable information to PostHog: no names, email addresses, phone numbers, or free text a user typed. Send stable ids and low cardinality attributes such as a plan name, a role, or a locale.

## Actions

| Action                       | Params                                             | Returns                        |
| ---------------------------- | -------------------------------------------------- | ------------------------------ |
| `PostHogInit`                | `apiKey`, `apiHost`, `options`, `debug`, `enabled` | `null`                         |
| `PostHogCapture`             | `event`, `properties`, `groups`                    | `null`                         |
| `PostHogPageview`            | `properties`                                       | `null`                         |
| `PostHogCapturePageLeave`    | `properties`                                       | `null`                         |
| `PostHogIdentify`            | `id`, `properties`, `propertiesOnce`               | `null`                         |
| `PostHogSetPersonProperties` | `set`, `setOnce`                                   | `null`                         |
| `PostHogAlias`               | `alias`                                            | `null`                         |
| `PostHogGroup`               | `type`, `key`, `properties`                        | `null`                         |
| `PostHogReset`               | `resetDeviceId`                                    | `null`                         |
| `PostHogOptIn`               | none                                               | `null`                         |
| `PostHogOptOut`              | none                                               | `null`                         |
| `PostHogFeatureFlag`         | `key`, `default`, `enabled`, `payload`             | the flag value, or `default`   |
| `PostHogReloadFeatureFlags`  | `timeout`                                          | `Promise<{ flags, variants }>` |

Full documentation, including examples, is at [docs.lowdefy.com/PostHog](https://docs.lowdefy.com/PostHog).

## Person swaps on a shared browser

PostHog refuses to move an already identified `distinct_id` onto a different person, so a shared browser needs a `reset()` between people. `PostHogIdentify` remembers the id it last identified in `localStorage` under `lowdefy_posthog_identified_id` and resets automatically when a different id arrives. A visitor who has never been identified is not reset, so the anonymous session still merges into the person, which is what makes signup funnels work.

`PostHogIdentify` also only resends person properties when they change, because every `setPersonProperties` call is a billable event and the action typically runs on every app load.
