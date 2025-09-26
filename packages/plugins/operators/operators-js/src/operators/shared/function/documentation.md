<TITLE>_function</TITLE>
<METADATA>env: Shared</METADATA>
<DESCRIPTION>The `_function` operator returns a function that evaluates the given operator definition when called. The resulting function can then be used by other operators like `_array.map`, or by blocks (for example as a formatter function).

To use a operator in a function definition, the operator name should start with a double underscore, `__`, instead of a single underscore. Operators that start with a single underscore will be evaluated when the function is created, and those that start with a double underscore are evaluated when the function is executed.

The arguments passed to the function when it is executed can be accessed with the [`_args`](/_args) operator.</DESCRIPTION>
<USAGE>(definition: any): function

###### any

The function definition. To use operators here, the operator names should start with a double underscore.</USAGE>
<EXAMPLES>###### Map over an array:

```yaml
_array.map:
  on:
    - firstName: Ted
      lastName: Mosby
    - firstName: Robin
      lastName: Scherbatsky
    - firstName: Marshall
      lastName: Eriksen
    - firstName: Lily
      lastName: Aldrin
    - firstName: Barney
      lastName: Stinson
  callback:
    _function:
      __string.concat:
        - __args: 0.firstName
        - ' '
        - __args: 0.lastName
```

Returns:

````yaml
- Ted Mosby
- Robin Scherbatsky
- Marshall Eriksen
- Lily Aldrin
- Barney Stinson
```</EXAMPLES>
````
