# PostHogOptOut

```
(void): Promise<null>
```

The `PostHogOptOut` action stops capturing for this person. The choice is remembered in the persistence store configured on [`PostHogInit`](/PostHogInit). See [`PostHogOptIn`](/PostHogOptIn) for consent flows.

When PostHog is disabled or `posthog-js` could not be loaded, the action does nothing.

The action is part of the [`@lowdefy/plugin-posthog`](/PostHog) plugin, which is included by default. See the [PostHog guide](/PostHog) for how the actions fit together.

#### Parameters

The `PostHogOptOut` action does not take any parameters.

#### Examples

###### Reject analytics from a consent banner:
```yaml
- id: reject_analytics
  type: Button
  properties:
    title: Reject
  events:
    onClick:
      - id: opt_out
        type: PostHogOptOut
```
