# @lowdefy/plugin-next-auth

Authentication plugin for Lowdefy using Auth.js (NextAuth.js).

## Overview

This plugin provides:

- OAuth providers (Google, GitHub, etc.)
- Credentials provider
- Database adapters
- Session callbacks
- JWT handling

## Providers

### OAuth Providers

```yaml
auth:
  providers:
    - id: google
      type: GoogleProvider
      properties:
        clientId:
          _secret: GOOGLE_CLIENT_ID
        clientSecret:
          _secret: GOOGLE_CLIENT_SECRET

    - id: github
      type: GitHubProvider
      properties:
        clientId:
          _secret: GITHUB_CLIENT_ID
        clientSecret:
          _secret: GITHUB_CLIENT_SECRET
```

### Available Providers

| Provider | Type               |
| -------- | ------------------ |
| Google   | `GoogleProvider`   |
| GitHub   | `GitHubProvider`   |
| Facebook | `FacebookProvider` |
| Twitter  | `TwitterProvider`  |
| LinkedIn | `LinkedInProvider` |
| Apple    | `AppleProvider`    |
| Discord  | `DiscordProvider`  |
| Slack    | `SlackProvider`    |
| Okta     | `OktaProvider`     |
| Azure AD | `AzureADProvider`  |
| Cognito  | `CognitoProvider`  |

### Credentials Provider

Email/password authentication:

```yaml
auth:
  providers:
    - id: credentials
      type: CredentialsProvider
      properties:
        name: Email
        credentials:
          email:
            label: Email
            type: email
          password:
            label: Password
            type: password
        authorize:
          _request: authenticateUser
```

## Callbacks

### Session Callback

Add data to session:

```yaml
auth:
  callbacks:
    session:
      - _function:
          __session.user.id: __user.id
          __session.user.roles: __user.roles
```

### JWT Callback

Add data to JWT token:

```yaml
auth:
  callbacks:
    jwt:
      - _function:
          __token.roles: __user.roles
```

## Adapters

### MongoDB Adapter

Store sessions in MongoDB:

```yaml
auth:
  adapter:
    type: MongoDBAdapter
    properties:
      connectionString:
        _secret: MONGODB_URI
      databaseName: auth
```

### Prisma Adapter

Store sessions with Prisma:

```yaml
auth:
  adapter:
    type: PrismaAdapter
    properties:
      # Uses PRISMA_DATABASE_URL env var
```

## Pages

Custom auth pages:

```yaml
auth:
  pages:
    signIn: /auth/login
    signOut: /auth/logout
    error: /auth/error
    newUser: /auth/welcome
```

## Accessing User

In configuration:

```yaml
# In requests
properties:
  query:
    userId:
      _user: id

# In blocks
properties:
  content:
    _string:
      - 'Welcome, '
      - _user: name
```

In page auth requirements:

```yaml
# Public page
auth:
  public: true

# Protected page (login required)
auth:
  public: false

# Role-based access
auth:
  roles:
    - admin
    - editor
```

## Session Configuration

```yaml
auth:
  session:
    strategy: jwt # jwt or database
    maxAge: 2592000 # 30 days
    updateAge: 86400 # 24 hours
```

## Login/Logout Actions

```yaml
# Trigger login
events:
  onClick:
    - id: login
      type: Login

# Trigger logout
events:
  onClick:
    - id: logout
      type: Logout
      params:
        redirect: /goodbye
```

## Environment Variables

| Variable          | Purpose                           |
| ----------------- | --------------------------------- |
| `NEXTAUTH_SECRET` | Session encryption key (required) |
| `NEXTAUTH_URL`    | App URL (for OAuth callbacks)     |

## Example Configuration

```yaml
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
          __session.user.role: __user.role

  pages:
    signIn: /login

  session:
    strategy: jwt
    maxAge: 604800 # 7 days
```
