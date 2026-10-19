# PostHogReloadFeatureFlags

```
(params: {
  timeout?: integer,
}): Promise<{ flags: string[], variants: object }>
```

The `PostHogReloadFeatureFlags` action asks PostHog to evaluate this person's feature flags again, and resolves once the new flags have arrived. Run it after [`PostHogIdentify`](/PostHogIdentify) or [`PostHogGroup`](/PostHogGroup) changed the targeting, then read the flags from its response or with [`PostHogFeatureFlag`](/PostHogFeatureFlag).

It resolves with empty results if PostHog does not answer within `timeout` milliseconds, so a flaky network can never stall the action chain. When PostHog is disabled or `posthog-js` could not be loaded, it resolves with empty results straight away.

The action is part of the [`@lowdefy/plugin-posthog`](/PostHog) plugin, which is included by default. See the [PostHog guide](/PostHog) for how the actions fit together.

#### Parameters

###### object
  - `timeout: integer`: Milliseconds to wait for PostHog to answer. Defaults to `5000`. Must not be negative.

#### Response

An object:
  - `flags: string[]`: The keys of the flags enabled for this person.
  - `variants: object`: Every flag key mapped to its value.

When PostHog does not answer in time, or is disabled, the response is `{ flags: [], variants: {} }`.

#### Examples

###### Reload flags after switching organization:
```yaml
- id: set_group
  type: PostHogGroup
  params:
    type: organization
    key:
      _state: organization_id
- id: reload_flags
  type: PostHogReloadFeatureFlags
  params:
    timeout: 3000
- id: store_flags
  type: SetState
  params:
    feature_flags:
      _actions: reload_flags.response.variants
```
