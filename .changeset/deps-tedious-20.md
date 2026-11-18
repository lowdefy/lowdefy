---
'@lowdefy/connection-knex': major
---

feat(connection-knex)!: Encrypt MSSQL connections by default, and update tedious to 20.3.8

Knex connections with `client: mssql` are now encrypted by default. Before, Knex turned encryption off for MSSQL unless the app set `encrypt`, so the login, password included, and every query were sent to the server unencrypted. Lowdefy now sets `options.encrypt: true` when the connection does not set `encrypt` itself. A connection that sets `encrypt` anywhere (`false`, `true` or `'strict'`, in `connection.options`, directly in `connection`, or in a connection string) keeps that setting.

tedious, the MSSQL driver, is also updated to 20.3.8, a security fix ([GHSA-wj7m-ffj3-574h](https://github.com/advisories/GHSA-wj7m-ffj3-574h)). Before, a connection with encryption on still sent the login unencrypted when the server answered that it does not support encryption. Now that connection fails with an `EENCRYPT` error: "Server did not negotiate encryption, but the 'encrypt' config option is set to `true`."

Your app is affected if it has a Knex connection with `client: mssql` that does not set `encrypt`, and:

- the server does not support encryption: the connection now fails with the `EENCRYPT` error above.
- the app does not trust the server's TLS certificate, for example the self-signed certificate SQL Server generates for itself when no certificate is configured: the connection now fails with a certificate error such as `self-signed certificate`.

Connections to Azure SQL Database, and to servers with a certificate the app trusts, need no change.

For a server with a self-signed certificate, trust it. The connection stays encrypted, but the certificate is not checked, so it is open to a man-in-the-middle. Installing a certificate the app trusts is better:

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
          trustServerCertificate: true
```

For a server that does not support encryption, enable TLS on the server. If you cannot, and the network between your app and the server is trusted, turn encryption off. The login and all queries are then sent unencrypted, as they were before this release:

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

In a connection string, add `?encrypt=false` to turn encryption off, or `?options={"trustServerCertificate":true}` to trust a self-signed certificate. A `?trustServerCertificate=true` parameter is ignored, because Knex only reads `trustServerCertificate` from `options`.

tedious 20 also prints a one-time deprecation warning when connecting with `options.tdsVersion: '7_1'` (SQL Server 2000); support for it will be removed in the next major version.
