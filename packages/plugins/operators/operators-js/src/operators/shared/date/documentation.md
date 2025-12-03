<TITLE>
_date
<TITLE>

<METADATA>
env: Shared
<METADATA>

<DESCRIPTION>
The `_date` operator provides access to JavaScript Date methods and constructors. It can create Date objects from various inputs (strings, timestamps, etc.) and access date manipulation methods like getting/setting date components, formatting, and parsing.

When called without a method, it creates a new Date object from the provided input. When called with `null` or `undefined`, methods that get date components will use the current date.
<DESCRIPTION>

<USAGE>
```
# Create a date
_date: dateInput

# Use a date method
_date.methodName: params

###### Constructor Methods
- now: Get current timestamp
- parse: Parse a date string to timestamp
- UTC: Create UTC timestamp

###### Getter Methods
- getDate, getDay, getFullYear, getHours, getMilliseconds
- getMinutes, getMonth, getSeconds, getTime, getTimezoneOffset
- getUTCDate, getUTCDay, getUTCFullYear, getUTCHours
- getUTCMilliseconds, getUTCMinutes, getUTCMonth, getUTCSeconds

###### Setter Methods
- setDate, setFullYear, setHours, setMilliseconds
- setMinutes, setMonth, setSeconds, setTime
- setUTCDate, setUTCFullYear, setUTCHours, setUTCMilliseconds
- setUTCMinutes, setUTCMonth, setUTCSeconds

###### Formatting Methods
- toDateString, toISOString, toJSON, toString
- toTimeString, toUTCString, valueOf
```
<USAGE>

<SCHEMA>
```yaml
# Create date from string or timestamp
_date: '2024-01-15'
_date: 1705276800000

# Get current timestamp
_date.now:

# Method with date input
_date.methodName: dateValue

# Setter methods with named args
_date.setFullYear:
  on: dateValue
  year: 2024
```
<SCHEMA>

<EXAMPLES>
### Create a date from ISO string:
```yaml
_date: '2024-06-15T10:30:00Z'
```

Returns: A JavaScript Date object for June 15, 2024 at 10:30 UTC

### Get current timestamp:
```yaml
_date.now:
```

Returns: Current timestamp in milliseconds (e.g., `1701619200000`)

### Get year from a date:
```yaml
_date.getFullYear:
  _state: created_date
```

Returns: `2024` (the year of the stored date)

### Format date to ISO string:
```yaml
_date.toISOString:
  _state: event_date
```

Returns: `'2024-06-15T10:30:00.000Z'`

### Get day of week:
```yaml
_date.getDay:
  _date: '2024-12-25'
```

Returns: `3` (Wednesday, where 0 = Sunday)

### Parse date string to timestamp:
```yaml
_date.parse: '2024-01-01T00:00:00Z'
```

Returns: `1704067200000` (timestamp in milliseconds)

### Calculate time difference:
```yaml
_subtract:
  - _date.valueOf:
      _date.now:
  - _date.valueOf:
      _state: start_date
```

Returns: Milliseconds between now and start_date

### Set specific year on existing date:
```yaml
_date.setFullYear:
  on:
    _state: expiry_date
  year: 2025
```

Returns: Updated date with year set to 2025

### Get month from stored date:
```yaml
_date.getMonth:
  _state: order_date
```

Returns: `5` for June (months are 0-indexed, so January = 0)

### Create UTC timestamp:
```yaml
_date.UTC:
  year: 2024
  month: 11
  day: 25
  hours: 12
  minutes: 0
  seconds: 0
```

Returns: UTC timestamp for December 25, 2024 at noon

### Convert date to readable string:
```yaml
_date.toDateString:
  _state: appointment_date
```

Returns: `'Sat Jun 15 2024'`
<EXAMPLES>
