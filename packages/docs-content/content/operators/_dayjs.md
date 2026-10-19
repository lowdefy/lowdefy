# _dayjs

The `_dayjs` operator provides date manipulation and formatting using the [Day.js](https://day.js.org/) library.

It supports two modes:
- **Method mode**: Call a specific method like `_dayjs.format` or `_dayjs.humanizeDuration`.
- **Chain mode**: Chain multiple Day.js operations together using an array.

#### Chain mode

Pass an array where the first element is the input date (or `"now"`), followed by method calls:

```yaml
_dayjs:
  - "now"
  - subtract:
      - 3
      - days
  - fromNow
```
Returns: `"3 days ago"`

Each step is either a string (method called with no arguments) or an object (key is the method name, value is the arguments).

```yaml
# Format a specific date
_dayjs:
  - "2024-03-15"
  - format: "YYYY-MM-DD"
```
Returns: `"2024-03-15"`

```yaml
# Add 1 month and format
_dayjs:
  - "2024-01-01"
  - add:
      - 1
      - month
  - format: "D MMM YYYY"
```
Returns: `"1 Feb 2024"`

```yaml
# Get start of month
_dayjs:
  - "2024-03-15"
  - startOf: month
  - format: "YYYY-MM-DD"
```
Returns: `"2024-03-01"`

```yaml
# Calculate difference in days
_dayjs:
  - "2024-03-15"
  - diff:
      - "2024-03-10"
      - days
```
Returns: `5`

**Supported chain methods:** `add`, `subtract`, `startOf`, `endOf`, `set`, `utc`, `local`, `locale`, `isBefore`, `isAfter`, `isSame`, `format`, `fromNow`, `from`, `toNow`, `to`, `diff`, `valueOf`, `unix`, `toISOString`, `toJSON`, `toString`, `daysInMonth`, `year`, `month`, `date`, `day`, `hour`, `minute`, `second`, `millisecond`, `week`.

> Migrating from v4? The `_moment` operator was renamed to `_dayjs` in v5. See the [v4 to v5 migration guide](/v4-to-v5) for details.

# Operator methods:

## _dayjs.format

```
(arguments: {
  on: date | string,
  locale?: string,
  format?: string
})
```

The `_dayjs.format` formats dates using the [Day.js](https://day.js.org/docs/en/display/format) library.

#### Arguments

###### object
  - `on: date | string`: The date to format.
  - `locale: string`: A string with a locale name.
  - `format: string`: A date [format string](https://day.js.org/docs/en/display/format).

#### Examples

###### Format a date:
```yaml
_dayjs.format:
  on:
    _date: 2019-06-04
  format: 'D MMM YYYY'
```
Returns: `"4 Jun 2019"`.

## _dayjs.humanizeDuration

```
(arguments: {
  on: number,
  locale?: string,
  withSuffix?: boolean
})
```

The `_dayjs.humanizeDuration` formats durations in milliseconds using [Day.js](https://day.js.org/docs/en/plugin/duration).

#### Arguments

###### object
  - `on: number`: The duration in milliseconds to format.
  - `locale: string`: A string with a locale name. Locale names are auto-normalized (e.g. `en-US` becomes `en`).
  - `withSuffix: boolean`: By default, the return string is describing a duration `a month` (suffix-less). If you want an oriented duration `in a month`, `a month ago` (with suffix), pass in true.

  > **Note:** The `thresholds` parameter from v4 is accepted but ignored in v5. Day.js uses fixed thresholds internally.

#### Examples

###### Format a duration:
```yaml
_dayjs.humanizeDuration:
  on: 245923000
  withSuffix: true
```
Returns: `"in 3 days"`.
