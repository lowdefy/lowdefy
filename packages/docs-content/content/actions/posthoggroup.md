# PostHogGroup

```
(params: {
  type: string,
  key: string,
  properties?: object,
}): Promise<null>
```

The `PostHogGroup` action associates the current person with a group, so events can be analysed per organization, team or account. The association sticks until [`PostHogReset`](/PostHogReset) is called, so run it after [`PostHogIdentify`](/PostHogIdentify). Group types have to be enabled on the PostHog project.

When PostHog is disabled or `posthog-js` could not be loaded, the action does nothing. Invalid params always throw, even when PostHog is disabled.

The action is part of the [`@lowdefy/plugin-posthog`](/PostHog) plugin, which is included by default. See the [PostHog guide](/PostHog) for how the actions fit together.

#### Parameters

###### object
  - `type: string`: __Required__ - The group type, for example `organization`.
  - `key: string`: __Required__ - The id of the group instance.
  - `properties: object`: Group properties.

#### Examples

###### Associate the person with their organization:
```yaml
- id: set_group
  type: PostHogGroup
  params:
    type: organization
    key:
      _user: organizationId
    properties:
      plan:
        _user: plan
```
