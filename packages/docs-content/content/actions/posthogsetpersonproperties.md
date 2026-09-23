# PostHogSetPersonProperties

```
(params: {
  set?: object,
  setOnce?: object,
}): Promise<null>
```

The `PostHogSetPersonProperties` action updates the properties of the person [`PostHogIdentify`](/PostHogIdentify) identified. Each call is a billable event; `posthog-js` skips a call identical to the previous one. Never send personally identifiable information.

When PostHog is disabled or `posthog-js` could not be loaded, the action does nothing. Invalid params always throw, even when PostHog is disabled.

The action is part of the [`@lowdefy/plugin-posthog`](/PostHog) plugin, which is included by default. See the [PostHog guide](/PostHog) for how the actions fit together.

#### Parameters

###### object
At least one of `set` or `setOnce` is required.
  - `set: object`: Person properties to set.
  - `setOnce: object`: Person properties that are only set if the person does not have them yet.

#### Examples

###### Record a plan change:
```yaml
- id: set_person_properties
  type: PostHogSetPersonProperties
  params:
    set:
      plan:
        _state: selected_plan
    setOnce:
      first_plan:
        _state: selected_plan
```
