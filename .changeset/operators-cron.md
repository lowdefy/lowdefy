---
'@lowdefy/operators-cron': minor
---

feat(operators-cron): new `@lowdefy/operators-cron` package with the `_cron` operator

Work with cron expressions in app config, on the client and the server. `_cron.next` and
`_cron.previous` return the occurrences of a cron expression as dates, from a given date and
in a given timezone, with `count` returning an array of occurrences. `_cron.describe` renders
an expression as a human readable sentence in any supported locale, `_cron.validate` tests
whether an expression is valid, and `_cron.fields` returns the parsed fields of an expression.
