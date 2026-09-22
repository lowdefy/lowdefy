# GetLocalStorage

```
(params: {
  key: string,
  default?: any
}): any
```

The `GetLocalStorage` action reads a value from the browser's [local storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage). Values written by the [`SetLocalStorage`](/SetLocalStorage) action are deserialized, so objects, arrays and dates are returned as the same types that were stored.

Local storage is per browser and per origin, so a value stored in one browser is not available in another.

#### Parameters

###### object
  - `key: string`: __Required__ - The local storage key to read.
  - `default: any`: The value returned when the key is not set in local storage.

#### Response

The value stored at the key, or the `default` value when the key is not set. When the key is not set and no `default` is given, the response is `undefined`.

#### Examples

###### Restore a user preference on page load:
```yaml
- id: read_preference
  type: GetLocalStorage
  params:
    key: dashboard_filters
    default:
      status: open
- id: apply_preference
  type: SetState
  params:
    filters:
      _actions: read_preference.response
```
