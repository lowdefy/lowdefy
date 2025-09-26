<TITLE>_switch</TITLE>
<METADATA>env: Shared</METADATA>
<DESCRIPTION>The `_switch` operator evaluates an array of conditions and returns the `then` argument of the first item for which the `if` argument evaluates to `true`. If no condition evaluates to `true`, the value of the `default` argument is returned.</DESCRIPTION>
<USAGE>```yaml
(arguments: {branches: {if: boolean, then: any}[], default: any}): any
```
###### object
  - `branches:`
      `if: boolean`: The boolean result of a test.
      `then: any`: The value to return if the test is `true`.
  - `default: any`: The value to return if all the `if` tests are `false`.</USAGE>
<EXAMPLES>###### Return a value based on a series of conditions:
```yaml
_switch:
  branches:
    - if:
        _eq:
          - x
          - y
      then: A
    - if:
        _eq:
          - x
          - z
      then: B
  default: C
```
Returns: `"C"` since both of the `if` tests are `false`.</EXAMPLES>
