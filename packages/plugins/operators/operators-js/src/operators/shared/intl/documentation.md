<TITLE>_intl</TITLE>
<METADATA>env: Shared</METADATA>
<DESCRIPTION>The `_intl` operator converts date objects to strings, using a specified format.</DESCRIPTION>
<USAGE>The `_intl` operator converts date objects to strings, using a specified format.</USAGE>
<EXAMPLES>###### Format a date:
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

###### Format a number:

```yaml
_intl.numberFormat:
  on: 13182375813.47422
  locale: de
```

Returns: `"13.182.375.813,474"`.

###### Format a number:

```yaml
_intl.relativeTimeFormat:
  on: 4
  unit: 'days'
  locale: fr
```

Returns: `"dans 4 jours"`.</EXAMPLES>
