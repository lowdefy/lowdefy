# PostHogFeatureFlag

```
(params: {
  key: string,
  default?: any,
  enabled?: boolean,
  payload?: boolean,
}): Promise<any>
```

The `PostHogFeatureFlag` action reads a PostHog feature flag and returns its value, so it can be used further down the action chain with the [`_actions`](/_actions) operator.

The value is whatever PostHog resolved for this person when flags were last loaded; the action does not wait for a network call. When the person or their groups just changed, reload the flags first with [`PostHogReloadFeatureFlags`](/PostHogReloadFeatureFlags).

Reading a flag value, with or without `enabled`, sends a `$feature_flag_called` event to PostHog, which is what PostHog experiments use to count exposures. Reading a payload does not.

When PostHog is disabled, not initialised, or `posthog-js` could not be loaded, the action returns `default`. Invalid params always throw, even when PostHog is disabled.

The action is part of the [`@lowdefy/plugin-posthog`](/PostHog) plugin, which is included by default. See the [PostHog guide](/PostHog) for how the actions fit together.

#### Parameters

###### object
  - `key: string`: __Required__ - The feature flag key.
  - `default: any`: Returned when the flag has no value for this person, and when PostHog is disabled. Defaults to `null`.
  - `enabled: boolean`: Return a boolean, using `isFeatureEnabled`, instead of the variant value.
  - `payload: boolean`: Return the flag payload, using `getFeatureFlagPayload`, instead of the flag value. Takes precedence over `enabled`.

#### Response

The flag value, the payload, or a boolean, depending on the params. `default` when the flag has no value.

#### Examples

###### Store a flag variant in state:
```yaml
events:
  onMount:
    - id: read_flag
      type: PostHogFeatureFlag
      params:
        key: new-checkout
        default: control
    - id: store_flag
      type: SetState
      params:
        checkout_variant:
          _actions: read_flag.response
```
