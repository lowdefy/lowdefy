# _change_case

The `_change_case` operator uses the [`change-case`](https://www.npmjs.com/package/change-case) package to transform an input between camelCase, PascalCase, Capital Case, snake_case, param-case, CONSTANT_CASE and others.

#### Arguments

The `_change_case` operator takes `on` and `options` as arguments.
The `on` argument is the input to be transformed and can be a `string`,  `array` or `object`.
The `options` argument is an object with the following properties:
  - `convertKeys`: Only used when `on` is an object. Toggles whether the object keys are converted to the new case (`true`) or left as-is (`false`). Default `false`.
  - `convertValues`: Only used when `on` is an object. Toggles whether the object values are converted to the new case (`true`) or left as-is (`false`). Default `true`.
  - `delimiter`: Value used between words (e.g. " ").
  - `locale`: Lower/upper according to specified locale, defaults to host environment. Set to false to disable.
  - `mergeAmbiguousCharacters`: By default, pascalCase and snakeCase separate ambiguous characters with _. To merge them instead, set mergeAmbiguousCharacters to true.
  - `prefixCharacters``: A string that specifies characters to retain at the beginning of the string. Defaults to "".
  - `split`: A function to define how the input is split into words.
  - `suffixCharacters``: A string that specifies characters to retain at the end of the string. Defaults to "".

The `on` argument behaves as follows:
###### string
Transforms the case of the string.

###### array
Transform the case of each string in the array.

###### object
Transforms the case of the values (when `options.convertValues: true`) and keys (when `options.convertKeys: true`) of the object.

> Note that the `key` and `value` pairs must be strings.

#### Examples

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

# Operator methods:

## _change_case.camelCase

```
({on: string, options: object}): string
([on: string, options: object]): string
({on: object, options: object}): object
([on: object, options: object]): object
({on: array, options: object}): array
([on: array, options: object]): array
```

The `_change_case.camelCase` method transforms `on` into a string with the separator denoted by the next word capitalized.

#### Examples

###### Transform snake_case variable to camelCase:
```yaml
_change_case.camelCase:
  on: 'my_variable'
```
Returns: `"myVariable"`

## _change_case.capitalCase

```
({on: string, options: object}): string
([on: string, options: object]): string
({on: object, options: object}): object
([on: object, options: object]): object
({on: array, options: object}): array
([on: array, options: object]): array
```

The `_change_case.capitalCase` method transforms `on` into a space separated string with each word capitalized.

#### Examples

###### Transform snake_case variable to capitalCase:
```yaml
_change_case.capitalCase:
  on: 'my_variable'
```
Returns:  `"My Variable"`

## _change_case.constantCase

```
({on: string, options: object}): string
([on: string, options: object]): string
({on: object, options: object}): object
([on: object, options: object]): object
({on: array, options: object}): array
([on: array, options: object]): array
```

The `_change_case.constantCase` method transforms `on` into upper case string with an underscore between words.

#### Examples

###### Transform camelCase variable to constantCase:
```yaml
_change_case.constantCase:
  on: 'myVariable'
```
Returns: `"MY_VARIABLE"`

## _change_case.dotCase

```
({on: string, options: object}): string
([on: string, options: object]): string
({on: object, options: object}): object
([on: object, options: object]): object
({on: array, options: object}): array
([on: array, options: object]): array
```

The `_change_case.dotCase` method transforms `on` into a lower case string with a period between words.

#### Examples

###### Transform camelCase variable to dotCase:
```yaml
_change_case.dotCase:
  on: 'myVariable'
```
Returns: `"my.variable"`

## _change_case.kebabCase

```
({on: string, options: object}): string
([on: string, options: object]): string
({on: object, options: object}): object
([on: object, options: object]): object
({on: array, options: object}): array
([on: array, options: object]): array
```

The `_change_case.kebabCase` method transforms `on` into a lower cased string with dashes between words.

#### Examples

###### Transform snake_case variable to kebabCase:
```yaml
_change_case.kebabCase:
  on: 'my_variable'
```
Returns: `"my-variable"`

## _change_case.noCase

```
({on: string, options: object}): string
([on: string, options: object]): string
({on: object, options: object}): object
([on: object, options: object]): object
({on: array, options: object}): array
([on: array, options: object]): array
```

The `_change_case.noCase` method transforms `on` into a lower cased string with spaces between words.

#### Examples

###### Transform camelCase variable to noCase:
```yaml
_change_case.noCase:
  on: 'myVariable'
```
Returns: `"my variable"`

## _change_case.pascalCase

```
({on: string, options: object}): string
([on: string, options: object]): string
({on: object, options: object}): object
([on: object, options: object]): object
({on: array, options: object}): array
([on: array, options: object]): array
```

The `_change_case.pascalCase` method transforms `on` into a string of capitalized words without separators.

#### Examples

###### Transform snake_case variable to pascalCase:
```yaml
_change_case.pascalCase:
  on: 'my_variable'
```
Returns: `"MyVariable"`

## _change_case.pascalSnakeCase

```
({on: string, options: object}): string
([on: string, options: object]): string
({on: object, options: object}): object
([on: object, options: object]): object
({on: array, options: object}): array
([on: array, options: object]): array
```

The `_change_case.pascalSnakeCase` method transforms `on` into a string of capitalized words with underscores between words.

#### Examples

###### Transform snake_case variable to pascalSnakeCase:
```yaml
_change_case.pascalCase:
  on: 'my_variable'
```
Returns: `"My_Variable"`

## _change_case.pathCase

```
({on: string, options: object}): string
([on: string, options: object]): string
({on: object, options: object}): object
([on: object, options: object]): object
({on: array, options: object}): array
([on: array, options: object]): array
```

The `_change_case.pathCase` method transforms `on` into a lower case string with slashes between words.

#### Examples

###### Transform snake_case variable to pathCase:
```yaml
_change_case.pathCase:
  on: 'my_variable'
```
Returns: `my/variable`

## _change_case.sentenceCase

```
({on: string, options: object}): string
([on: string, options: object]): string
({on: object, options: object}): object
([on: object, options: object]): object
({on: array, options: object}): array
([on: array, options: object]): array
```

The `_change_case.sentenceCase` method transforms `on` into a lower case with spaces between words, then capitalize the first word.

#### Examples

###### Transform snake_case variable to sentenceCase:
```yaml
_change_case.sentenceCase:
  on: 'my_variable'
```
Returns: `"My variable"`

## _change_case.snakeCase

```
({on: string, options: object}): string
([on: string, options: object]): string
({on: object, options: object}): object
([on: object, options: object]): object
({on: array, options: object}): array
([on: array, options: object]): array
```

The `_change_case.snakeCase` method transforms `on` into a lower case string with underscores between words.

#### Examples

###### Transform sentence case variable to snakeCase:
```yaml
_change_case.snakeCase:
  on: 'My variable'
```
Returns: `"my_variable"`

## _change_case.trainCase

```
({on: string, options: object}): string
([on: string, options: object]): string
({on: object, options: object}): object
([on: object, options: object]): object
({on: array, options: object}): array
([on: array, options: object]): array
```

The `_change_case.trainCase` method transforms `on` into a dash separated string of capitalized words.

#### Examples

###### Transform snake_case variable to trainCase:
```yaml
_change_case.trainCase:
  on: 'my_variable'
```
Returns: `"My-Variable"`
