# PostHogOptIn

```
(void): Promise<null>
```

The `PostHogOptIn` action starts capturing for this person. Pair it with [`PostHogOptOut`](/PostHogOptOut) and a [`PostHogInit`](/PostHogInit) that sets `options.opt_out_capturing_by_default: true` when consent is required before any data is sent. The choice is remembered in the persistence store configured on `PostHogInit`.

When PostHog is disabled or `posthog-js` could not be loaded, the action does nothing.

The action is part of the [`@lowdefy/plugin-posthog`](/PostHog) plugin, which is included by default. See the [PostHog guide](/PostHog) for how the actions fit together.

#### Parameters

The `PostHogOptIn` action does not take any parameters.

#### Examples

###### Accept analytics from a consent banner:
```yaml
- id: accept_analytics
  type: Button
  properties:
    title: Accept
  events:
    onClick:
      - id: opt_in
        type: PostHogOptIn
```
