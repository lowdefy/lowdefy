# PostHogAlias

```
(params: {
  alias: string,
}): Promise<null>
```

The `PostHogAlias` action points a second id at the person PostHog already knows, for example when an app has its own identifier alongside the one used by [`PostHogIdentify`](/PostHogIdentify).

When PostHog is disabled or `posthog-js` could not be loaded, the action does nothing. Invalid params always throw, even when PostHog is disabled.

The action is part of the [`@lowdefy/plugin-posthog`](/PostHog) plugin, which is included by default. See the [PostHog guide](/PostHog) for how the actions fit together.

#### Parameters

###### object
  - `alias: string`: __Required__ - The second id for the current person.

#### Examples

###### Alias a customer number:
```yaml
- id: alias_person
  type: PostHogAlias
  params:
    alias:
      _user: customerNumber
```
