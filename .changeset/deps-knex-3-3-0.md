---
'@lowdefy/connection-knex': patch
---

fix(deps): Update knex to 3.3.0, mysql2 to 3.24.6 and pg to 8.23.1

Updates the Knex connection's query builder and its MySQL and PostgreSQL drivers. Knex now keeps
bindings in the right order in PostgreSQL and MSSQL update and delete queries and handles
connection timeouts on streamed queries. mysql2 strips brackets from IPv6 hosts and keeps the
connect timeout active until the handshake completes. pg now validates the server certificate
against the host when connecting to an IP address over TLS, and adds support for Node 26.
