# PostHogCapturePageLeave

```
(params: {
  properties?: object,
}): Promise<null>
```

The `PostHogCapturePageLeave` action captures a `$pageleave` event by hand, the counterpart to [`PostHogPageview`](/PostHogPageview). PostHog uses pageleaves to compute bounce rate and time on page.

`posthog-js` captures a pageleave itself when the tab is closed, as long as automatic pageviews are on, because `capture_pageleave` defaults to `if_capture_pageview`. With `capture_pageview: false`, set `capture_pageleave: true` in the [`PostHogInit`](/PostHogInit) options to keep them, or use this action, for example before a `Link` or `Logout` action. The page `onHidden` event is not a page leave: it also fires when the browser window loses focus.

When PostHog is disabled or `posthog-js` could not be loaded, the action does nothing. Invalid params always throw, even when PostHog is disabled.

The action is part of the [`@lowdefy/plugin-posthog`](/PostHog) plugin, which is included by default. See the [PostHog guide](/PostHog) for how the actions fit together.

#### Parameters

###### object
  - `properties: object`: Properties to add to the `$pageleave` event.

#### Examples

###### Capture a pageleave before signing out:
```yaml
- id: sign_out
  type: Button
  properties:
    title: Sign out
  events:
    onClick:
      - id: capture_pageleave
        type: PostHogCapturePageLeave
      - id: reset_posthog
        type: PostHogReset
      - id: logout
        type: Logout
```
