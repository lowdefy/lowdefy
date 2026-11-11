---
'@lowdefy/connection-knex': major
---

fix(deps): Update tedious to 20.3.8

Security fix for Knex connections with `client: mssql` ([GHSA-wj7m-ffj3-574h](https://github.com/advisories/GHSA-wj7m-ffj3-574h)). Before this update, a connection with encryption turned on still sent the login, password included, unencrypted when the server answered that it does not support encryption. Now that connection fails with an `EENCRYPT` error: "Server did not negotiate encryption, but the 'encrypt' config option is set to `true`."

Your app is affected if a Knex connection with `client: mssql` turns encryption on with `encrypt: true`, either in `connection.options`, directly in `connection`, or as `?encrypt=true` in a connection string, and the server does not support encryption. Connections that do not set `encrypt` are not affected: Knex turns encryption off for MSSQL by default, so they already send the login and queries unencrypted. The MSSQL connection docs now show how to turn encryption on.

The fix is to enable TLS encryption on the SQL Server. If you cannot, and the network between your app and the server is trusted, turn encryption off on the connection. The login and all queries are then sent unencrypted:

```yaml
connections:
  - id: mssql
    type: Knex
    properties:
      client: mssql
      connection:
        host:
          _secret: MSSQL_HOST
        database:
          _secret: MSSQL_DB
        user:
          _secret: MSSQL_USER
        password:
          _secret: MSSQL_PASSWORD
        options:
          encrypt: false
```

In a connection string, use `?encrypt=false`. Once the server supports encryption, a server with a self-signed certificate also needs `options.trustServerCertificate: true`, which skips the certificate check.

tedious 20 also prints a one-time deprecation warning when connecting with `options.tdsVersion: '7_1'` (SQL Server 2000); support for it will be removed in the next major version.
