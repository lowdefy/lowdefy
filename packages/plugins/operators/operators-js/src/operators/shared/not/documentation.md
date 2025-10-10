<TITLE>_not</TITLE>
<METADATA>env: Shared</METADATA>
<DESCRIPTION>The `_not` operator returns the logical negation of the input value. It uses javascript [truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy) and [falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy) rules.</DESCRIPTION>
<USAGE>(value: any): boolean
###### any
The value to negate.</USAGE>
<EXAMPLES>###### Negate `true`:
```yaml
_not: true
```
Returns: `false`

###### Negate `false`:

```yaml
_not: false
```

Returns: `true`

###### Negate a number:

```yaml
_not: 42
```

Returns: `false`

###### Negate `null`:

```yaml
_not: null
```

Returns: `true`

###### Negate an empty string:

```yaml
_not: ''
```

Returns: `true`

###### Negate an empty array:

```yaml
_not: []
```

Returns: `false`</EXAMPLES>
