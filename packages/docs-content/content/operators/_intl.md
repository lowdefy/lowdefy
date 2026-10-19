# _intl

The `_intl` operator converts date objects to strings, using a specified format.

> This operator can be used as a [`_build`](/_build) operator method.

# Operator methods:

## _intl.dateTimeFormat

```
(arguments: {
  on: date,
  locale?: string,
  options?: object
})
```

The `_intl.dateTimeFormat` provides language-sensitive date and time formatting, based on [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat). If no locale is provide, the users default locale will be used.

#### Arguments

###### object
  - `on: date`: The date object to format.
  - `locale: string`: A string with a BCP 47 language tag, or an array of such strings.
  - `options: object`: [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat) options.

#### Examples

###### Format a date:
```yaml
_intl.dateTimeFormat:
  on:
    _date: 2019-06-13
  locale: en
  options:
    weekday: long
    year: numeric
    month: long
    day: numeric
```
Returns: `"Thursday, June 13, 2019"`.

## _intl.listFormat

```
(arguments: {
  on: any[],
  locale?: string,
  options?: object
})
```

The `_intl.listFormat` provides language-sensitive list formatting, based on [`Intl.ListFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat/ListFormat). If no locale is provide, the users default locale will be used.

#### Arguments

###### object
  - `on: any[]`: The array to format.
  - `locale: string`: A string with a BCP 47 language tag, or an array of such strings.
  - `options: object`: [`Intl.ListFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat/ListFormat) options.

#### Examples

###### Format a list:
```yaml
_intl.listFormat:
  on:
    - Motorcycle
    - Bus
    - Car
  locale: fr
```
Returns: `"Motorcycle, Bus et Car"`.

## _intl.numberFormat

```
(arguments: {
  on: number,
  locale?: string,
  options?: object
})
```

The `_intl.numberFormat` provides language-sensitive number formatting, based on [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat). If no locale is provide, the users default locale will be used.

#### Arguments

###### object
  - `on: number`: The number to format.
  - `locale: string`: A string with a BCP 47 language tag, or an array of such strings.
  - `options: object`: [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat) options.

#### Examples

###### Format a number:
```yaml
_intl.numberFormat:
  on: 13182375813.47422
  locale: de
```
Returns: `"13.182.375.813,474"`.

## _intl.relativeTimeFormat

```
(arguments: {
  on: any,
  locale?: string,
  unit: enum,
  options?: object
})
```

The `_intl.relativeTimeFormat` provides language-sensitive relative time  formatting, based on [`Intl.RelativeTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat/RelativeTimeFormat). If no locale is provide, the users default locale will be used.

#### Arguments

###### object
  - `on: number`: The number to format.
  - `locale: string`: A string with a BCP 47 language tag, or an array of such strings.
  - `unit: enum`: Unit to use in the relative time internationalized message. Possible values are: `year`, `quarter`, `month`, `week`, `day`, `hour`, `minute`, `second`. Plural forms are also permitted.
  - `options: object`: [`Intl.RelativeTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat/RelativeTimeFormat) options.

#### Examples

###### Format a number:
```yaml
_intl.relativeTimeFormat:
  on: 4
  unit: 'days'
  locale: fr
```
Returns: `"dans 4 jours"`.
