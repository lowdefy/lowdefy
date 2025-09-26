<TITLE>
change_case
</TITLE>

<METADATA>
env: Shared
</METADATA>

<DESCRIPTION>
The `_change_case` operator uses the [`change-case`](https://www.npmjs.com/package/change-case) package to transform an input between camelCase, PascalCase, Capital Case, snake_case, param-case, CONSTANT_CASE and others.
</DESCRIPTION>

<EXAMPLES>
###### String with no options:
```yaml
_change_case.capitalCase:
  on: 'foo bar'
```
Returns: `"Foo Bar"`

###### Array with no options:

```yaml
_change_case.capitalCase:
  on:
    - 'foo'
    - 'bar'
```

Returns: `["Foo", "Bar"]`

###### Object with no options:

```yaml
_change_case.capitalCase:
  on:
    foo: 'bar'
```

Returns: `{ "foo": "Bar" }`

###### Object with options.convertKeys: true:

```yaml
_change_case.capitalCase:
  on:
    foo: 'bar'
  options:
    convertKeys: true
```

Returns: `{ "Foo": "Bar" }`

###### Object with options.convertValues: false:

```yaml
_change_case.capitalCase:
  on:
    foo: 'bar'
  options:
    convertValues: false
```

Returns: `{ "foo": "bar" }`

###### Object with options.SPLT:

```yaml
_change_case.capitalCase:
  on: this123is_an example string
  options:
    split:
      _function:
        __string.split:
          - __string.replace:
              - __args: 0
              - '123'
              - '_'
            - '_'
```

Returns: `This Is An example string`
</EXAMPLES>
