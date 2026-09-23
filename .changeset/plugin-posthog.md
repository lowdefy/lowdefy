---
'@lowdefy/plugin-posthog': minor
---

feat(plugin-posthog): new PostHog product analytics plugin

A default plugin that wraps the `posthog-js` browser SDK, so no script tag or snippet is
needed. `posthog-js` is loaded lazily by `PostHogInit`, so an app with `enabled: false`
never downloads it. Run `PostHogInit` from every page's `onInit` event, shared with `_ref`;
repeat calls with the same `apiKey` do nothing.

Adds `PostHogInit`, `PostHogCapture`, `PostHogPageview`, `PostHogCapturePageLeave`,
`PostHogIdentify`, `PostHogSetPersonProperties`, `PostHogAlias`, `PostHogGroup`,
`PostHogReset`, `PostHogOptIn`, `PostHogOptOut`, `PostHogFeatureFlag` and
`PostHogReloadFeatureFlags`, each with a params schema.

With PostHog disabled every other action is a silent no-op, so analytics can never break an
app, but invalid params still throw and an action that runs before `PostHogInit` logs a
console warning. `PostHogIdentify` reads the identity `posthog-js` holds and resets before
identifying a different person on a shared browser.
