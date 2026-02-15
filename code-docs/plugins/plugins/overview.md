# Plugins Category Overview

"Plugins" are composite packages that provide authentication, cloud integrations, and utilities that span multiple plugin types.

## What Are Plugin Plugins?

Unlike single-purpose plugins (blocks, connections, operators, actions), these packages provide:
- Authentication providers and adapters
- Cloud service integrations
- Multi-component functionality
- Cross-cutting utilities

## Available Plugin Packages

| Package | Purpose | Provides |
|---------|---------|----------|
| [@lowdefy/plugin-next-auth](./next-auth.md) | Authentication | Auth providers, callbacks, adapters |
| [@lowdefy/plugin-aws](./aws.md) | AWS integration | S3 connection, Lambda support |
| [@lowdefy/plugin-auth0](./auth0.md) | Auth0 integration | Auth0-specific provider |
| [@lowdefy/plugin-csv](./csv.md) | CSV utilities | CSV parsing operators |

## Authentication in Lowdefy

Authentication is built on Auth.js (formerly NextAuth.js):

```yaml
# lowdefy.yaml
auth:
  providers:
    - id: google
      type: GoogleProvider
      properties:
        clientId:
          _secret: GOOGLE_CLIENT_ID
        clientSecret:
          _secret: GOOGLE_CLIENT_SECRET
  callbacks:
    session:
      - _function:
          __session.user.id: __user.id
```

### Auth Configuration

```yaml
auth:
  # Authentication providers
  providers: [...]

  # Session callbacks
  callbacks:
    jwt: [...]
    session: [...]

  # Page customization
  pages:
    signIn: /login
    signOut: /logout
    error: /auth-error

  # Advanced options
  adapter: MongoDBAdapter
  session:
    strategy: jwt
```

## Plugin Package Structure

Composite plugins can export multiple types:

```javascript
export default {
  // Auth providers
  auth: {
    providers: {
      GoogleProvider: { ... },
    },
    adapters: {
      MongoDBAdapter: { ... },
    },
    callbacks: {
      sessionCallback: { ... },
    },
  },

  // Connections
  connections: {
    S3Bucket: { ... },
  },

  // Requests
  requests: {
    S3Upload: { ... },
  },

  // Operators
  operators: {
    client: { ... },
    server: { ... },
  },
};
```

## Design Decisions

### Why Composite Plugins?

Some functionality requires multiple components:
- Auth needs providers, adapters, and callbacks
- AWS needs connections and operators
- Better package organization

### Why Auth.js?

Auth.js provides:
- 50+ OAuth providers
- JWT and database sessions
- Secure implementation
- Active maintenance
- Industry standard
