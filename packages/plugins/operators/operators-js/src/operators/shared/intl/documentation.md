<TITLE>
_intl
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_intl` operator provides access to JavaScript's Internationalization API (Intl) for formatting dates, numbers, lists, and relative time according to locale-specific conventions.

Available methods:
- `dateTimeFormat`: Format dates according to locale
- `numberFormat`: Format numbers with locale-specific separators and currency
- `listFormat`: Format arrays as localized lists
- `relativeTimeFormat`: Format relative time (e.g., "3 days ago")
<DESCRIPTION>

<USAGE>
```
_intl.methodName: params

###### dateTimeFormat
Formats a date according to locale conventions.
- on: Date to format
- options: Intl.DateTimeFormat options
- locale: Locale string (e.g., 'en-US')

###### numberFormat
Formats a number according to locale conventions.
- on: Number to format
- options: Intl.NumberFormat options
- locale: Locale string

###### listFormat
Formats an array as a localized list.
- on: Array of strings
- options: Intl.ListFormat options
- locale: Locale string

###### relativeTimeFormat
Formats relative time.
- on: Numeric value
- unit: Time unit (second, minute, hour, day, week, month, year)
- options: Intl.RelativeTimeFormat options
- locale: Locale string
```
<USAGE>

<SCHEMA>
```yaml
_intl.dateTimeFormat:
  on: date
  options:
    dateStyle: full | long | medium | short
    timeStyle: full | long | medium | short
  locale: string

_intl.numberFormat:
  on: number
  options:
    style: decimal | currency | percent | unit
    currency: string
    minimumFractionDigits: number
  locale: string

_intl.listFormat:
  on: array
  options:
    style: long | short | narrow
    type: conjunction | disjunction | unit
  locale: string

_intl.relativeTimeFormat:
  on: number
  unit: string
  options:
    numeric: always | auto
    style: long | short | narrow
  locale: string
```
<SCHEMA>

<EXAMPLES>
### Format date with locale:
```yaml
_intl.dateTimeFormat:
  on:
    _state: event_date
  options:
    dateStyle: long
  locale: en-US
```

Returns: 'December 25, 2024'

### Format currency:
```yaml
_intl.numberFormat:
  on:
    _state: price
  options:
    style: currency
    currency: USD
  locale: en-US
```

Returns: '$1,234.56'

### Format number with thousands separator:
```yaml
_intl.numberFormat:
  on: 1234567.89
  options:
    minimumFractionDigits: 2
    maximumFractionDigits: 2
  locale: en-US
```

Returns: '1,234,567.89'

### Format percentage:
```yaml
_intl.numberFormat:
  on:
    _divide:
      - _state: completed
      - _state: total
  options:
    style: percent
    minimumFractionDigits: 1
  locale: en-US
```

Returns: '75.5%'

### Format list of items:
```yaml
_intl.listFormat:
  on:
    - Sales
    - Marketing
    - Engineering
  options:
    style: long
    type: conjunction
  locale: en-US
```

Returns: 'Sales, Marketing, and Engineering'

### Format relative time:
```yaml
_intl.relativeTimeFormat:
  on: -3
  unit: day
  options:
    numeric: auto
  locale: en-US
```

Returns: '3 days ago'

### Date and time formatting:
```yaml
_intl.dateTimeFormat:
  on:
    _state: appointment_datetime
  options:
    dateStyle: medium
    timeStyle: short
  locale: en-US
```

Returns: 'Dec 25, 2024, 2:30 PM'
<EXAMPLES>
