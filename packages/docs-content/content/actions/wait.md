# Wait

```
(params: {
  ms: integer,
}): void
```

The `Wait` waits for the set number of milliseconds before returning.

#### Parameters

###### object
  - `ms: integer`: __Required__ - The number of milliseconds to wait.

#### Examples

###### Wait for 500 milliseconds:
```yaml
- id: wait
  type: Wait
  params:
    ms: 500
```
