---
'@lowdefy/plugin-posthog': minor
---

feat(plugin-posthog): new PostHog product analytics plugin

A default plugin that bundles the `posthog-js` browser SDK, so no script tag or snippet is
needed. `PostHogInit` initialises PostHog from the app level `events.onInit`, and takes an
`enabled: false` for environments where analytics should be off. Every other action is a
silent no-op until it has run, so analytics can never break an app.

Adds `PostHogCapture`, `PostHogPageview`, `PostHogCapturePageLeave`, `PostHogIdentify`,
`PostHogSetPersonProperties`, `PostHogAlias`, `PostHogGroup`, `PostHogReset`,
`PostHogOptIn`, `PostHogOptOut`, `PostHogFeatureFlag` and `PostHogReloadFeatureFlags`.

`PostHogIdentify` remembers the id it last identified, so a person swap on a shared browser
resets before identifying, and person properties are only resent when they change.
