<TITLE>
_and
<TITLE>

<METADATA>
env: Shared
</METADATA>

<DESCRIPTION>
The `_and` operator performs a logical `and` over an array of inputs, using javascript [truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy) and [falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy) rules.

It only returns true if all the values in the array are truthy (not `false`, `0`, `null`, `undefined`, or the empty string `""`). Else it returns false.
<DESCRIPTION>

<USAGE>
```
(values: any[]): boolean

###### array

An array of values over which to perform a logical and.

````
</USAGE>

<EXAMPLES>
### Two `true` values:
```yaml
_and:
  - true
  - true
````

Returns: `true`

### Array of `true` and `false` values:

```yaml
_and:
  - true
  - true
  - true
  - false
```

Returns: `false`

### Check if two boolean inputs are true:

```yaml
_and:
  - _state: confirm_accept_terms
  - _state: confirm_accept_privacy_policy
```

Returns: `true` if both inputs are `true`

### Truthy values:

```yaml
_and:
  - 'Hello'
  - 42
  - []
  - key: value
```

Returns: `true`

### Falsy values:

```yaml
_and:
  - true
  - null
```

Returns: `false`

```yaml
_and:
  - true
  - 0
```

Returns: `false`

```yaml
_and:
  - true
  - ''
```

Returns: `false`
</EXAMPLES>
