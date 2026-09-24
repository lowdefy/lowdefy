# @lowdefy/plugin-posthog

PostHog product analytics for Lowdefy apps: initialise `posthog-js`, capture events, identify people and groups, manage consent and read feature flags.

This package is included in Lowdefy by default. `posthog-js` is bundled with the app, so no script tag or reverse proxy setup is needed, and it is loaded lazily: it is only downloaded when `PostHogInit` runs with PostHog enabled.

## Initialising

`PostHogInit` must run before any other action in this package. A user can open the app on any page, so run it from the `onInit` event of every page, sharing the actions with `_ref`. `PostHogInit` is idempotent, so this is safe: later calls with the same `apiKey` do nothing.

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
- id: identify_person
  type: PostHogIdentify
  params:
    id:
      _user: id
```

```yaml
# pages/reports.yaml
id: reports
type: PageHeaderMenu
events:
  onInit:
    _ref: shared/posthog_init.yaml
```

The PostHog project API key is a public, write only key that is meant to ship in the browser bundle, so `_build.env` is the right operator for it. Never use a personal API key here.

With `enabled: false`, `posthog-js` is never downloaded and every other action in this package becomes a silent no-op. In the example above, leaving `POSTHOG_API_KEY` unset, for example in local development, turns analytics off.

`capture_pageview: history_change` makes `posthog-js` capture a pageview on every client side navigation. Without it, only the first page of a session is captured. `PostHogPageview` and `PostHogCapturePageLeave` are there for apps that capture pageviews by hand.

When the app declares `config.environments`, `PostHogInit` registers the current environment's name as the `environment` super property on every event, so one PostHog project can hold staging and production.

## Never breaks the app

Analytics must never break an app. Every action other than `PostHogInit` does nothing and returns `null` when PostHog is disabled or `posthog-js` could not be downloaded. `PostHogFeatureFlag` returns its configured `default` instead, and `PostHogReloadFeatureFlags` returns `{ flags: [], variants: {} }`.

Config mistakes are still reported: invalid params always throw, even with PostHog disabled, and an action that runs before `PostHogInit` logs a warning to the browser console once. An action that runs while `PostHogInit` is still loading `posthog-js` waits for it.

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

PostHog refuses to move an already identified `distinct_id` onto a different person, so a shared browser needs a `reset()` between people. `PostHogIdentify` reads the identity `posthog-js` already holds: when the id is already the current `distinct_id` it only updates person properties; when the browser is identified as someone else (`$user_state` is `identified`) it resets first; and an anonymous visitor is identified without a reset, so the anonymous session merges into the person, which is what makes signup funnels work.
