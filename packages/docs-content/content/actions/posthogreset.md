# PostHogReset

```
(params: {
  resetDeviceId?: boolean,
}): Promise<null>
```

The `PostHogReset` action forgets the current person and starts a fresh anonymous session. Run it on sign out so the next person on a shared browser is not merged into this one.

When PostHog is disabled or `posthog-js` could not be loaded, the action does nothing. Invalid params always throw, even when PostHog is disabled.

The action is part of the [`@lowdefy/plugin-posthog`](/PostHog) plugin, which is included by default. See the [PostHog guide](/PostHog) for how the actions fit together.

#### Parameters

###### object
  - `resetDeviceId: boolean`: Also generate a new device id, so the browser is not recognised as the same device. Defaults to `false`.

#### Examples

###### Reset PostHog on sign out:
```yaml
- id: reset_posthog
  type: PostHogReset
- id: logout
  type: Logout
```
