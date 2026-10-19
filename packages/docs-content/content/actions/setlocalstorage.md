# SetLocalStorage

```
(params: {
  key: string,
  value: any
}): void
```

The `SetLocalStorage` action stores a value in the browser's [local storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage), under the given key. Values are serialized, so objects, arrays and dates are read back as the same types by the [`GetLocalStorage`](/GetLocalStorage) action.

Local storage is per browser and it is not sent to the server. Keys are kept per app: Lowdefy stores the value under a key that names the app's `slug` and base path, so apps served from the same origin do not read or overwrite each other's values. A value stored under the bare key before keys were kept per app is moved to the app's key the first time `GetLocalStorage` reads it.

Values set with this action are kept when a user signs out, so the next person to use the browser can read them. Do not store secrets, tokens or personal data in it.

Keys starting with `lowdefy_` or `lf-` are reserved for settings Lowdefy stores itself, such as the dark mode preference, and the action throws an error if one is used. If the browser blocks local storage, or the storage quota is full, the action fails with an error that is shown to the user and triggers the event's `catch` actions, but is not logged as an app error.

#### Parameters

###### object
  - `key: string`: __Required__ - The local storage key to write to. Keys starting with `lowdefy_` or `lf-` are reserved.
  - `value: any`: __Required__ - The value to store.

#### Examples

###### Remember a user preference:
```yaml
- id: save_preference
  type: SetLocalStorage
  params:
    key: dashboard_filters
    value:
      _state: filters
```
