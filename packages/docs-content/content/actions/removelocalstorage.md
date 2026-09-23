# RemoveLocalStorage

```
(params: {
  key: string
}): void
```

The `RemoveLocalStorage` action removes a key from the browser's [local storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage). Removing a key that is not set does nothing.

Keys starting with `lowdefy_` or `lf-` are reserved for settings Lowdefy stores itself, such as the dark mode preference, and the action throws an error if one is used. If the browser blocks local storage, the action fails with an error that is shown to the user and triggers the event's `catch` actions, but is not logged as an app error.

#### Parameters

###### object
  - `key: string`: __Required__ - The local storage key to remove. Keys starting with `lowdefy_` or `lf-` are reserved.

#### Examples

###### Clear a stored preference:
```yaml
- id: clear_preference
  type: RemoveLocalStorage
  params:
    key: dashboard_filters
```
