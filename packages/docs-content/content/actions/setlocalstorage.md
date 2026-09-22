# SetLocalStorage

```
(params: {
  key: string,
  value: any
}): void
```

The `SetLocalStorage` action stores a value in the browser's [local storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage), under the given key. Values are serialized, so objects, arrays and dates are read back as the same types by the [`GetLocalStorage`](/GetLocalStorage) action.

Local storage is per browser and per origin, and it is not sent to the server. Do not store secrets, tokens or personal data in it.

#### Parameters

###### object
  - `key: string`: __Required__ - The local storage key to write to.
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
