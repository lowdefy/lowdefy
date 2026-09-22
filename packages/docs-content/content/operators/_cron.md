# _cron

The `_cron` operator works with [cron expressions](https://en.wikipedia.org/wiki/Cron#CRON_expression). It can calculate the next and previous occurrences of a schedule, describe a schedule in a human readable sentence, test if an expression is valid, and return the parsed fields of an expression.

A cron expression has five fields, `minute hour day-of-month month day-of-week`, and an optional leading seconds field. For example, `0 9 * * 1` is "At 09:00 AM, only on Monday".

Every method takes the cron expression as a string, or as the `expression` property of an object when more arguments are needed:

```yaml
_cron.next: 0 9 * * 1
```

```yaml
_cron.next:
  expression: 0 9 * * 1
  timezone: Europe/London
```

This operator is provided by the `@lowdefy/operators-cron` plugin package.

# Operator methods:

## _cron.next

```
(expression: string): date
(arguments: {
  expression: string,
  from?: date | string,
  timezone?: string,
  count?: number
}): date | date[]
```

The `_cron.next` method returns the next occurrence of a cron expression as a date. When `count` is greater than 1, an array of the next `count` occurrences is returned, in chronological order.

An error is thrown if the cron expression can not be parsed.

#### Arguments

###### expression
The cron expression, for example `0 9 * * 1`. Required.

###### from
The date to calculate the next occurrence from, as a date or an ISO 8601 date string. Defaults to the current date and time.

###### timezone
The [IANA timezone name](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones), for example `Europe/London`, that the cron expression is evaluated in. Defaults to the timezone of the environment that evaluates the operator.

###### count
The number of occurrences to return. A `count` of 1 returns a single date, a `count` greater than 1 returns an array of dates. Defaults to 1.

#### Examples

###### Next occurrence:
```yaml
_cron.next: 0 9 * * 1
```
Returns: The date of the next Monday at 09:00.

###### Next occurrence in a timezone, from a given date:
```yaml
_cron.next:
  expression: 0 9 * * 1
  from:
    _date: 2024-01-01T00:00:00.000Z
  timezone: UTC
```
Returns: `2024-01-01T09:00:00.000Z`

###### The next three occurrences:
```yaml
_cron.next:
  expression: 0 9 * * 1
  from:
    _date: 2024-01-01T00:00:00.000Z
  timezone: UTC
  count: 3
```
Returns: `[2024-01-01T09:00:00.000Z, 2024-01-08T09:00:00.000Z, 2024-01-15T09:00:00.000Z]`

## _cron.previous

```
(expression: string): date
(arguments: {
  expression: string,
  from?: date | string,
  timezone?: string,
  count?: number
}): date | date[]
```

The `_cron.previous` method returns the previous occurrence of a cron expression as a date. When `count` is greater than 1, an array of the previous `count` occurrences is returned, most recent first.

An error is thrown if the cron expression can not be parsed.

#### Arguments

###### expression
The cron expression, for example `0 9 * * 1`. Required.

###### from
The date to calculate the previous occurrence from, as a date or an ISO 8601 date string. Defaults to the current date and time.

###### timezone
The [IANA timezone name](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones), for example `Europe/London`, that the cron expression is evaluated in. Defaults to the timezone of the environment that evaluates the operator.

###### count
The number of occurrences to return. A `count` of 1 returns a single date, a `count` greater than 1 returns an array of dates. Defaults to 1.

#### Examples

###### Previous occurrence:
```yaml
_cron.previous:
  expression: 0 9 * * 1
  from:
    _date: 2024-01-01T00:00:00.000Z
  timezone: UTC
```
Returns: `2023-12-25T09:00:00.000Z`

###### The previous three occurrences:
```yaml
_cron.previous:
  expression: 0 9 * * 1
  from:
    _date: 2024-01-01T00:00:00.000Z
  timezone: UTC
  count: 3
```
Returns: `[2023-12-25T09:00:00.000Z, 2023-12-18T09:00:00.000Z, 2023-12-11T09:00:00.000Z]`

## _cron.describe

```
(expression: string): string
(arguments: {
  expression: string,
  locale?: string,
  verbose?: boolean,
  use24HourTimeFormat?: boolean
}): string
```

The `_cron.describe` method returns a human readable description of a cron expression, like "At 09:00 AM, only on Monday".

An empty string is returned when the expression is `null`, `undefined` or `""`, so the method is safe to use in a label that might not have a schedule yet. An error is thrown if the expression is given but can not be parsed.

#### Arguments

###### expression
The cron expression, for example `0 9 * * 1`. Required.

###### locale
The locale to describe the expression in, for example `fr`. Defaults to `en`.

###### verbose
Describe the expression in a more verbose sentence. Defaults to `false`.

###### use24HourTimeFormat
Describe times in the 24 hour format. Defaults to the format used by the locale.

#### Examples

###### Describe a schedule:
```yaml
_cron.describe: 0 9 * * 1
```
Returns: `"At 09:00 AM, only on Monday"`.

###### Describe a schedule in the 24 hour format:
```yaml
_cron.describe:
  expression: 0 9 * * 1
  use24HourTimeFormat: true
```
Returns: `"At 09:00, only on Monday"`.

###### Describe a schedule in another locale:
```yaml
_cron.describe:
  expression: 0 9 * * 1
  locale: fr
```
Returns: `"À 09:00, uniquement le lundi"`.

###### Describe a schedule verbosely:
```yaml
_cron.describe:
  expression: '*/5 * * * *'
  verbose: true
```
Returns: `"Every 5 minutes, every hour, every day"`.

## _cron.validate

```
(expression: string): boolean
(arguments: { expression: string }): boolean
```

The `_cron.validate` method returns `true` when the cron expression is valid, and `false` when it is not. A missing expression returns `false`. This method never throws, so it can be used to validate a cron expression captured by an input block.

#### Arguments

###### expression
The cron expression to validate.

#### Examples

###### Validate a schedule:
```yaml
_cron.validate: 0 9 * * 1
```
Returns: `true`.

###### Validate user input:
```yaml
- id: schedule
  type: TextInput
  validate:
    - status: error
      message: Not a valid cron expression.
      pass:
        _cron.validate:
          _state: schedule
```

## _cron.fields

```
(expression: string): object
(arguments: { expression: string }): object
```

The `_cron.fields` method returns the parsed fields of a cron expression as an object with a `second`, `minute`, `hour`, `dayOfMonth`, `month` and `dayOfWeek` key. Each field has the list of `values` it matches, and a `wildcard` boolean that is `true` when the field was given as `*`.

An error is thrown if the cron expression can not be parsed.

#### Arguments

###### expression
The cron expression, for example `0 9 * * 1`. Required.

#### Examples

###### Fields of a schedule:
```yaml
_cron.fields: 0 9 * * 1
```
Returns:
```yaml
second:
  wildcard: false
  values: [0]
minute:
  wildcard: false
  values: [0]
hour:
  wildcard: false
  values: [9]
dayOfMonth:
  wildcard: true
  values: [1, 2, 3, '...', 31]
month:
  wildcard: true
  values: [1, 2, 3, '...', 12]
dayOfWeek:
  wildcard: false
  values: [1]
```
