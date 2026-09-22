# RemoveLocalStorage

```
(params: {
  key: string
}): void
```

The `RemoveLocalStorage` action removes a key from the browser's [local storage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage). Removing a key that is not set does nothing.

#### Parameters

###### object
  - `key: string`: __Required__ - The local storage key to remove.

#### Examples

###### Clear a stored preference:
```yaml
- id: clear_preference
  type: RemoveLocalStorage
  params:
    key: dashboard_filters
```
