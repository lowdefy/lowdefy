---
'@lowdefy/operators-cron': minor
---

feat(operators-cron): new `@lowdefy/operators-cron` package with the `_cron` operator

Work with cron expressions in app config, on the client and the server. `_cron.next` and
`_cron.previous` return the occurrences of a cron expression as dates, from a given date and
in a given timezone, with `count` (up to 1000) returning an array of occurrences.
`_cron.describe` renders an expression as a human readable sentence in any cronstrue locale,
`_cron.validate` tests whether an expression is valid without ever throwing, and `_cron.fields`
returns the parsed fields of an expression.

All methods share one set of rules: blank expressions count as missing, the `H` hash token is
rejected (it would pick a random time on every evaluation), expressions that never occur are
invalid, and `from` must be a date or an ISO 8601 date string.
