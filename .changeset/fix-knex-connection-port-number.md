---
'@lowdefy/connection-knex': patch
---

fix(connection-knex): Pass a numeric port to the database driver.

A port taken from a connection string or a `_secret` reached the driver as a string, which `mssql` (tedious) rejects with `The "config.options.port" property must be of type number`. The Knex connection now coerces a string port to a number for every client, and fails with a `ConfigError` when the port is not a valid port number.
