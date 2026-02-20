# Connections Plugin Overview

Connections enable Lowdefy apps to communicate with external data sources and APIs.

## What Are Connections?

Connections are:

- Server-side data adapters
- Configured with credentials and endpoints
- Used by requests to fetch/mutate data
- Secure (secrets never sent to client)

## Connection Architecture

```
┌──────────────────┐
│  Client Request  │
│   (action)       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   @lowdefy/api   │
│   Server-side    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│   Connection     │
│   (plugin)       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  External Data   │
│  Source / API    │
└──────────────────┘
```

## Available Connection Packages

| Package                                                 | Data Source                 | Request Types          |
| ------------------------------------------------------- | --------------------------- | ---------------------- |
| [@lowdefy/connection-mongodb](./mongodb.md)             | MongoDB                     | CRUD, Aggregation      |
| [@lowdefy/connection-axios-http](./axios-http.md)       | REST APIs                   | GET, POST, PUT, DELETE |
| [@lowdefy/connection-knex](./knex.md)                   | SQL (Postgres, MySQL, etc.) | Query, Insert, Update  |
| [@lowdefy/connection-elasticsearch](./elasticsearch.md) | Elasticsearch               | Search, Index          |
| [@lowdefy/connection-google-sheets](./google-sheets.md) | Google Sheets               | Read, Write            |
| [@lowdefy/connection-redis](./redis.md)                 | Redis                       | Get, Set, List ops     |
| [@lowdefy/connection-sendgrid](./sendgrid.md)           | SendGrid                    | Send emails            |
| [@lowdefy/connection-stripe](./stripe.md)               | Stripe                      | Payments, Customers    |

## Connection Configuration

Connections are defined in `lowdefy.yaml`:

```yaml
connections:
  - id: mongodb
    type: MongoDBCollection
    properties:
      connectionString:
        _secret: MONGODB_URI
      databaseName: myapp
      collection: users
```

## Request Configuration

Requests use connections to operate on data:

```yaml
requests:
  - id: getUsers
    type: MongoDBFind
    connectionId: mongodb
    properties:
      query:
        active: true
      options:
        sort:
          createdAt: -1
```

## Security Model

### Secrets

Connection credentials use `_secret`:

```yaml
properties:
  connectionString:
    _secret: MONGODB_URI # From environment
```

Secrets:

- Set via environment variables
- Never sent to client
- Evaluated server-side only

### Read/Write Permissions

Connections can restrict operations:

```yaml
properties:
  read: true # Allow read operations
  write: false # Block write operations
```

### Request Authorization

Each request can have auth rules:

```yaml
requests:
  - id: deleteUser
    auth:
      - roles:
          - admin
```

## Connection Plugin Structure

Each connection package exports:

```javascript
export default {
  connections: {
    MongoDBCollection: {
      schema: { ... },         // JSON schema for properties
      requests: [...],         // Supported request types
    },
  },
  requests: {
    MongoDBFind: {
      schema: { ... },         // JSON schema for request props
      resolver: async (ctx) => { ... },
    },
  },
};
```

## Design Decisions

### Why Server-Side Only?

Connections run server-side because:

- Credentials must stay secure
- Database drivers aren't browser-compatible
- Network security (firewalls, VPNs)
- Rate limiting and caching

### Why Separate Connection and Request?

**Connection**: Shared configuration (credentials, endpoint)
**Request**: Specific operation (query, mutation)

Multiple requests can share one connection.

### Why Use Operators in Properties?

Operators like `_secret` and `_user` enable:

- Dynamic credentials
- Per-user data access
- Environment-specific config
