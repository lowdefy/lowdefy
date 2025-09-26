<TITLE>_divide</TITLE>
<METADATA>env: Shared</METADATA>
<DESCRIPTION>The `_divide` operator divides two numbers. It takes an array of two numbers as input and returns the first number divided by the second. Dividing by zero will throw an error.</DESCRIPTION>
<USAGE>([numerator: number, denominator: number]): number
###### array
An array of two numbers.</USAGE>
<EXAMPLES>###### Divide two numbers:
```yaml
_divide:
  - 12
  - 4
```
Returns: `3`

###### Cannot divide by zero:

```yaml
_divide:
  - 1
  - 0
```

Returns: `null` and throws a operator error.</EXAMPLES>
