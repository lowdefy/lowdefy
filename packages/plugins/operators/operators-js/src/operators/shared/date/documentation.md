<TITLE>_date</TITLE>
<METADATA>env: Shared</METADATA>
<DESCRIPTION>The `_date` operator returns a date object representing a single moment in time. It can take a string in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format, or a number that is the number of milliseconds since 1 January 1970 UTC (the [UNIX epoch](https://en.wikipedia.org/wiki/Unix_time)).</DESCRIPTION>
<USAGE>(dateString: string): date
(unixTimestamp: number): date
###### string
An string in ISO 8601 format representing a date and time.

###### number

The number of milliseconds since 1 January 1970 UTC.</USAGE>
<EXAMPLES>###### Timestamp:

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

Returns: Thu Jan 28 2021 12:38:29 GMT+0000</EXAMPLES>
