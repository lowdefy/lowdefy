# _date

```
(dateString: string): date
(unixTimestamp: number): date
```

The `_date` operator returns a date object representing a single moment in time. It can take a string in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format, or a number that is the number of milliseconds since 1 January 1970 UTC (the [UNIX epoch](https://en.wikipedia.org/wiki/Unix_time)).

> This operator can be used as a [`_build`](/_build) operator method.

#### Arguments

###### string
An string in ISO 8601 format representing a date and time.

###### number
The number of milliseconds since 1 January 1970 UTC.

#### Examples

###### Timestamp:
```yaml
_date: 1611837509802
```
Returns: Thu Jan 28 2021 12:38:29 GMT+0000

###### ISO 8601 string, only date:
```yaml
_date: 2021-01-28
```
Returns: Thu Jan 28 2021 00:00:00 GMT+0000

###### ISO 8601 string, date and time:
```yaml
_date: 2021-01-28T12:36:03.957Z
```
Returns: Thu Jan 28 2021 12:38:29 GMT+0000

# Operator methods:

## _date.getDate

```
(value: date): number
```

The `_date.getDate` method returns the [day of the month](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getDate) of a date.

## _date.getDay

```
(value: date): number
```

The `_date.getDay` method returns the [day of the week](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getDay) of a date.

## _date.getFullYear

```
(value: date): number
```

The `_date.getFullYear` method returns the [year](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getFullYear) of a date.

## _date.getHours

```
(value: date): number
```

The `_date.getHours` method returns the [hour](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getHours) of a date.

## _date.getMilliseconds

```
(value: date): number
```

The `_date.getMilliseconds` method returns the [milliseconds](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getMilliseconds) of a date.

## _date.getMinutes

```
(value: date): number
```

The `_date.getMinutes` method returns the [minutes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getMinutes) of a date.

## _date.getMonth

```
(value: date): number
```

The `_date.getMonth` method returns the [month](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getMonth) of a date.

## _date.getSeconds

```
(value: date): number
```

The `_date.getSeconds` method returns the [seconds](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getSeconds) of a date.

## _date.getTime

```
(value: date): number
```

The `_date.getTime` method returns the number of [milliseconds since the epoch](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTime), which is defined as the midnight at the beginning of January 1, 1970, UTC.

## _date.getTimezoneOffset

```
(value: date): number
```

The `_date.getTimezoneOffset` method returns the [difference, in minutes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset), between a date as evaluated in the UTC time zone, and the same date as evaluated in the local time zone.

## _date.getUTCDate

```
(value: date): number
```

The `_date.getUTCDate` method returns the [day of the month](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getUTCDate) of a date according to universal time.

## _date.getUTCDay

```
(value: date): number
```

The `_date.getUTCDay` method returns the [day of the week](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getUTCDay) of a date according to universal time.

## _date.getUTCFullYear

```
(value: date): number
```

The `_date.getUTCFullYear` method returns the [year](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getUTCFullYear) of a date according to universal time.

## _date.getUTCHours

```
(value: date): number
```

The `_date.getUTCHours` method returns the [hour](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getUTCHours) of a date according to universal time.

## _date.getUTCMilliseconds

```
(value: date): number
```

The `_date.getUTCMilliseconds` method returns the [milliseconds](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getUTCMilliseconds) of a date according to universal time.

## _date.getUTCMinutes

```
(value: date): number
```

The `_date.getUTCMinutes` method returns the [minutes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getUTCMinutes) of a date according to universal time.

## _date.getUTCMonth

```
(value: date): number
```

The `_date.getUTCMonth` method returns the [month](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getUTCMonth) of a date according to universal time.

## _date.getUTCSeconds

```
(value: date): number
```

The `_date.getUTCSeconds` method returns the [seconds](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getUTCSeconds) of a date according to universal time.

## _date.now

```
(void): date
```

The `_date.now` method returns a date object representing the moment in time it was called. The method can also be used as `_date: now`

#### Arguments

The `_date.now` method does not take any arguments.

#### Examples

###### Get the current date and time:
```yaml
_date.now: null
```
```yaml
_date: now
```
Returns: The current date and time.

## _date.parse

```
(value: date): string
```

The `_date.parse` method parses a string representation of a date, and returns the number of [milliseconds](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse) since January 1, 1970, 00:00:00 UTC.

## _date.setDate

```
(arguments: {on: date, dayOfMonth: number}): number
(arguments: [on: date, dayOfMonth: number]): number
```

The `_date.setDate` method changes the [day of the month](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setDate) of a date.

## _date.setFullYear

```
(arguments: {on: date, year: number}): number
(arguments: [on: date, year: number]): number
```

The `_date.setFullYear` method sets the [full year](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setFullYear) of a date.

## _date.setHours

```
(arguments: {on: date, hours: number}): number
(arguments: [on: date, hours: number]): number
```

The `_date.setHours` method sets the [hours](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setHours) of a date.

## _date.setMilliseconds

```
(arguments: {on: date, milliseconds: number}): number
(arguments: [on: date, milliseconds: number]): number
```

The `_date.setMilliseconds` method sets the [milliseconds](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setMilliseconds) of a date.

## _date.setMinutes

```
(arguments: {on: date, minutes: number}): number
(arguments: [on: date, minutes: number]): number
```

The `_date.setMinutes` method sets the [minutes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setMinutes) of a date.

## _date.setMonth

```
(arguments: {on: date, month: number}): number
(arguments: [on: date, month: number]): number
```

The `_date.setMonth` method sets the [month](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setMonth) of a date.

## _date.setSeconds

```
(arguments: {on: date, seconds: number}): number
(arguments: [on: date, seconds: number]): number
```

The `_date.setSeconds` method sets the [seconds](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setSeconds) of a date.

## _date.setTime

```
(arguments: {on: date, time: number}): number
(arguments: [on: date, time: number]): number
```

The `_date.setTime` method sets the [time](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setTime) represented by a number of milliseconds since January 1, 1970, 00:00:00 UTC.

## _date.setUTCDate

```
(arguments: {on: date, dayOfMonth: number}): number
(arguments: [on: date, dayOfMonth: number]): number
```

The `_date.setUTCDate` method changes the [day of the month](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setUTCDate) of a date, based on UTC time.

## _date.setUTCFullYear

```
(arguments: {on: date, year: number}): number
(arguments: [on: date, year: number]): number
```

The `_date.setUTCFullYear` method sets the [full year](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setUTCFullYear) of a date, based on UTC time.

## _date.setUTCHours

```
(arguments: {on: date, hours: number}): number
(arguments: [on: date, hours: number]): number
```

The `_date.setUTCHours` method sets the [hours](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setUTCHours) of a date, based on UTC time.

## _date.setUTCMilliseconds

```
(arguments: {on: date, milliseconds: number}): number
(arguments: [on: date, milliseconds: number]): number
```

The `_date.setUTCMilliseconds` method sets the [milliseconds](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setUTCMilliseconds) of a date, based on UTC time.

## _date.setUTCMinutes

```
(arguments: {on: date, minutes: number}): number
(arguments: [on: date, minutes: number]): number
```

The `_date.setUTCMinutes` method sets the [minutes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setUTCMinutes) of a date, based on UTC time.

## _date.setUTCMonth

```
(arguments: {on: date, month: number}): number
(arguments: [on: date, month: number]): number
```

The `_date.setUTCMonth` method sets the [month](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setUTCMonth) of a date, based on UTC time.

## _date.setUTCSeconds

```
(arguments: {on: date, seconds: number}): number
(arguments: [on: date, seconds: number]): number
```

The `_date.setUTCSeconds` method sets the [seconds](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setUTCSeconds) of a date, based on UTC time.

## _date.toDateString

```
(value: date): string
```

The `_date.toDateString` method returns the [date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toDateString) as a string.

## _date.toISOString

```
(value: date): string
```

The `_date.toISOString` method returns the [date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString) as a string in ISO format.

## _date.toJSON

```
(value: date): string
```

The `_date.toJSON` method returns the [date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toJSON) as a string in ISO format.

## _date.toString

```
(value: date): string
```

The `_date.toString` method returns the [date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toString) as a string.

## _date.toTimeString

```
(value: date): string
```

The `_date.toTimeString` method returns the [time](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toTimeString) of a date as a string.

## _date.toUTCString

```
(value: date): string
```

The `_date.toUTCString` method returns the [date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toUTCString) as a string in UTC time.

## _date.UTC

```
(arguments: {year: number, month: number, day: number, hours: number, minutes: number, seconds: number}): number
(arguments: [year: number, month: number, day: number, hours: number, minutes: number, seconds: number]): number
```

The `_date.UTC` method accepts [year, month, day, hours, minutes, seconds parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/UTC) of a date but treats them as UTC.

## _date.valueOf

```
(value: date): number
```

The `_date.valueOf` method returns the [primitive value](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/valueOf) of a date.
