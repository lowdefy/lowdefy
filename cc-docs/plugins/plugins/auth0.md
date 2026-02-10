# @lowdefy/plugin-auth0

Auth0 integration plugin for Lowdefy.

## Overview

Provides Auth0-specific provider with full Auth0 features.

## Provider

| Type | Purpose |
|------|---------|
| `Auth0Provider` | Auth0 authentication |

## Configuration

```yaml
auth:
  providers:
    - id: auth0
      type: Auth0Provider
      properties:
        clientId:
          _secret: AUTH0_CLIENT_ID
        clientSecret:
          _secret: AUTH0_CLIENT_SECRET
        issuer:
          _secret: AUTH0_ISSUER     # https://your-tenant.auth0.com
```

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `clientId` | string | Auth0 application client ID |
| `clientSecret` | string | Auth0 application client secret |
| `issuer` | string | Auth0 domain URL |

## Environment Variables

```bash
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_ISSUER=https://your-tenant.auth0.com
```

## Auth0 Application Setup

1. Create application in Auth0 dashboard
2. Set application type to "Regular Web Application"
3. Add callback URL: `https://your-app.com/api/auth/callback/auth0`
4. Add logout URL: `https://your-app.com`
5. Copy credentials to environment variables

## Features

Auth0 provides:
- Universal Login
- Social connections
- Enterprise connections (SAML, LDAP)
- Multi-factor authentication
- User management
- Role-based access control

## Session with Auth0 Data

```yaml
auth:
  providers:
    - id: auth0
      type: Auth0Provider
      properties:
        clientId:
          _secret: AUTH0_CLIENT_ID
        clientSecret:
          _secret: AUTH0_CLIENT_SECRET
        issuer:
          _secret: AUTH0_ISSUER

  callbacks:
    session:
      - _function:
          __session.user.roles: __token.roles
    jwt:
      - _function:
          __token.roles: __profile.roles
```
