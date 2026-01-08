# Auth System Architecture

How authentication integrates with Lowdefy.

## Overview

Lowdefy authentication is built on Auth.js (NextAuth.js) and provides:
- OAuth/OIDC providers (Google, GitHub, Auth0, etc.)
- Credentials authentication
- Database adapters for session storage
- Role-based access control
- Protected pages and API endpoints

## Configuration Structure

### In lowdefy.yaml

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

  adapter:
    type: MongoDBAdapter
    properties:
      connectionString:
        _secret: MONGODB_URI

  callbacks:
    session:
      - _function:
          __session.user.roles: __token.roles
    jwt:
      - _function:
          __token.roles: __user.roles

  pages:
    protected: [dashboard, settings]
    public: [home, about]
    roles:
      admin: [admin-panel]

  authPages:
    signIn: /login
    error: /auth/error

  session:
    strategy: jwt
    maxAge: 2592000
```

## Build-Time Processing

### Auth Configuration Building

**File:** `packages/build/src/build/buildAuth/buildAuth.js`

```javascript
function buildAuth({ components, context }) {
  const configured = !type.isNone(components.auth);
  components.auth.configured = configured;

  validateAuthConfig({ components });
  buildApiAuth({ components });      // API endpoint protection
  buildPageAuth({ components });     // Page protection
  buildAuthPlugins({ components, context });

  return components;
}
```

### Page Protection

**File:** `packages/build/src/build/buildAuth/buildPageAuth.js`

```javascript
function buildPageAuth({ components }) {
  const protectedPages = getProtectedPages({ components });
  const pageRoles = getPageRoles({ components });

  components.pages.forEach((page) => {
    if (pageRoles[page.id]) {
      page.auth = { public: false, roles: pageRoles[page.id] };
    } else if (protectedPages.includes(page.id)) {
      page.auth = { public: false };
    } else {
      page.auth = { public: true };
    }
  });
}
```

### API Protection

**File:** `packages/build/src/build/buildAuth/buildApiAuth.js`

```javascript
function buildApiAuth({ components }) {
  const protectedEndpoints = getProtectedApi({ components });
  const apiRoles = getApiRoles({ components });

  components.api.forEach((endpoint) => {
    if (apiRoles[endpoint.id]) {
      endpoint.auth = { public: false, roles: apiRoles[endpoint.id] };
    } else if (protectedEndpoints.includes(endpoint.id)) {
      endpoint.auth = { public: false };
    } else {
      endpoint.auth = { public: true };
    }
  });
}
```

## NextAuth Configuration

### Config Translation

**File:** `packages/api/src/routes/auth/getNextAuthConfig.js`

```javascript
function getNextAuthConfig({ authJson, logger, plugins, secrets }) {
  // Parse operators (_secret support)
  const operatorsParser = new ServerParser({
    operators: { _secret },
    secrets,
  });

  const { output: authConfig } = operatorsParser.parse({
    input: authJson,
    location: 'auth',
  });

  // Build NextAuth options
  return {
    adapter: createAdapter({ authConfig, plugins }),
    callbacks: createCallbacks({ authConfig, plugins }),
    events: createEvents({ authConfig, plugins }),
    providers: createProviders({ authConfig, plugins }),
    pages: authConfig.authPages,
    session: authConfig.session,
    theme: authConfig.theme,
    cookies: authConfig?.advanced?.cookies,
    debug: authConfig.debug
  };
}
```

### Provider Creation

**File:** `packages/api/src/routes/auth/createProviders.js`

```javascript
function createProviders({ authConfig, plugins }) {
  return authConfig.providers.map((providerConfig) =>
    plugins.providers[providerConfig.type]({
      ...providerConfig.properties,
      id: providerConfig.id,
    })
  );
}
```

### Available Providers

**File:** `packages/plugins/plugins/plugin-next-auth/src/auth/providers.js`

60+ providers including:
- OAuth: Google, GitHub, Discord, LinkedIn, Twitter
- Enterprise: Okta, Azure AD, Keycloak, Auth0
- SAML: BoxyHQ SAML
- Custom: OpenIDConnectProvider, CredentialsProvider

## Callback Pipeline

### JWT Callback

**File:** `packages/api/src/routes/auth/callbacks/createJWTCallback.js`

Runs on login and token refresh:

```javascript
async function jwtCallback({ token, user, account, profile, isNewUser }) {
  // Extract OIDC claims
  if (profile) {
    token = {
      id, sub, name, given_name, family_name,
      email, email_verified, picture, ...token
    };
  }

  // Add custom userFields
  if (authConfig.userFields) {
    addUserFieldsToToken({ authConfig, account, profile, token, user });
  }

  // Execute custom callback plugins
  for (const plugin of jwtCallbackPlugins) {
    token = await plugin.fn({ account, profile, token, user });
  }

  return token;
}
```

### Session Callback

**File:** `packages/api/src/routes/auth/callbacks/createSessionCallback.js`

Runs on session updates:

```javascript
async function sessionCallback({ session, token, user }) {
  // Map token to session.user
  session.user = {
    id, sub, name, given_name, family_name,
    email, picture, ...
  };

  // Add custom userFields
  if (authConfig.userFields) {
    addUserFieldsToSession({ authConfig, session, token, user });
  }

  // Execute custom plugins
  for (const plugin of sessionCallbackPlugins) {
    session = await plugin.fn({ session, token, user });
  }

  // Create anonymized hash for analytics
  session.hashed_id = crypto.createHash('sha256')
    .update(identifier ?? '')
    .digest('base64');

  return session;
}
```

### SignIn Callback

**File:** `packages/api/src/routes/auth/callbacks/createSignInCallback.js`

Controls login authorization:

```javascript
async function signInCallback({ account, credentials, email, profile, user }) {
  let allowSignIn = true;

  for (const plugin of signInCallbackPlugins) {
    allowSignIn = await plugin.fn({
      account, credentials, email, profile, user
    });
    if (allowSignIn === false) break;
  }

  return allowSignIn;
}
```

### User Fields Mapping

**Files:** `addUserFieldsToToken.js`, `addUserFieldsToSession.js`

```yaml
# Configuration
auth:
  userFields:
    company: 'profile.company'
    department: 'profile.department'
    roles: 'profile.roles'
```

```javascript
// Implementation
function addUserFieldsToToken({ authConfig, account, profile, token, user }) {
  Object.entries(authConfig.userFields).forEach(([fieldName, providerField]) => {
    const value = get({ account, profile, user }, providerField);
    set(token, fieldName, value);
  });
}
```

## Authorization

### Authorize Function

**File:** `packages/api/src/context/createAuthorize.js`

```javascript
function createAuthorize({ session }) {
  const authenticated = !!session;
  const roles = session?.user?.roles ?? [];

  function authorize({ auth }) {
    if (auth.public === true) return true;

    if (auth.public === false) {
      if (auth.roles) {
        // Role-based: user must have one of the required roles
        return authenticated && auth.roles.some(role => roles.includes(role));
      }
      // Auth-only: user must be authenticated
      return authenticated;
    }

    throw new ServerError('Invalid auth configuration');
  }

  return authorize;
}
```

### Page Authorization

**File:** `packages/api/src/routes/page/getPageConfig.js`

```javascript
async function getPageConfig({ authorize, readConfigFile }, { pageId }) {
  const pageConfig = await readConfigFile(`pages/${pageId}/${pageId}.json`);

  if (pageConfig && authorize(pageConfig)) {
    const { auth, ...rest } = pageConfig;  // Remove auth metadata
    return { ...rest };
  }

  return null;  // 404 for unauthorized
}
```

### API Authorization

**File:** `packages/api/src/routes/endpoints/authorizeApiEndpoint.js`

```javascript
function authorizeApiEndpoint({ authorize }, { endpointConfig }) {
  if (!authorize(endpointConfig)) {
    throw new ConfigurationError('Not authorized');
  }
}
```

## Session Injection

### Server-Side Props

**File:** `packages/servers/server/lib/server/serverSidePropsWrapper.js`

```javascript
function serverSidePropsWrapper(handler) {
  return async function wrappedHandler(nextContext) {
    const context = { ... };

    // Initialize auth options
    context.authOptions = getAuthOptions(context);

    // Fetch server session
    context.session = await getServerSession(context);

    // Create API context with authorization
    createApiContext(context);

    return handler({ context, nextContext });
  };
}
```

### Client-Side Context

**File:** `packages/servers/server/lib/client/auth/AuthConfigured.js`

```javascript
function AuthConfigured({ authConfig, children, serverSession }) {
  const auth = { authConfig, getSession, signIn, signOut };

  return (
    <SessionProvider session={serverSession} basePath={basePath}>
      <Session>
        {(session) => {
          auth.session = session;
          return children(auth);
        }}
      </Session>
    </SessionProvider>
  );
}
```

## The _user Operator

**File:** `packages/plugins/operators/operators-js/src/operators/shared/user.js`

```javascript
function _user({ arrayIndices, location, params, user }) {
  return getFromObject({
    arrayIndices,
    location,
    object: user,
    operator: '_user',
    params,
  });
}
```

**Usage:**
```yaml
# In block properties
content:
  _string:
    - 'Welcome, '
    - _user: session.user.name

# In request authorization
visible:
  _eq:
    - _user: session.user.role
    - admin
```

## API Route

**File:** `packages/servers/server/pages/api/auth/[...nextauth].js`

```javascript
async function handler({ context, req, res }) {
  if (authJson.configured !== true) {
    return res.status(404).json({ message: 'Auth not configured' });
  }

  // Corporate email link check
  if (req.method === 'HEAD') {
    return res.status(200).end();
  }

  return NextAuth(req, res, context.authOptions);
}
```

Handles:
- `/api/auth/signin` - Login
- `/api/auth/signout` - Logout
- `/api/auth/callback/[provider]` - OAuth callbacks
- `/api/auth/session` - Session retrieval
- `/api/auth/csrf` - CSRF protection

## Auth Events

**File:** `packages/api/src/routes/auth/events/createEvents.js`

```javascript
const events = {
  createUser,   // First login - user created
  linkAccount,  // Account linked to user
  signIn,       // User signed in
  signOut,      // User signed out
  updateUser,   // Profile updated
  session       // Session events
};
```

## Architecture Diagram

```
lowdefy.yaml
    ↓
buildAuth() [BUILD TIME]
    ├→ validateAuthConfig()
    ├→ buildPageAuth() → page.auth = { public, roles }
    ├→ buildApiAuth() → endpoint.auth = { public, roles }
    └→ buildAuthPlugins()
    ↓
auth.json
    ↓
[RUNTIME - PAGE REQUEST]
    ↓
serverSidePropsWrapper()
    ├→ getAuthOptions() → getNextAuthConfig()
    │   ├→ createProviders()
    │   ├→ createCallbacks()
    │   ├→ createEvents()
    │   └→ createAdapter()
    │
    ├→ getServerSession()
    │
    └→ createApiContext() → createAuthorize(session)
    ↓
Page Handler
    └→ getPageConfig() → authorize(pageConfig)
    ↓
_app.js [CLIENT]
    ↓
Auth Component (SessionProvider)
    ↓
Page Component
    ├→ auth.session
    ├→ _user operator
    └→ auth.signIn/signOut
```

## Key Files

| Component | File |
|-----------|------|
| Config Validation | `packages/build/src/build/buildAuth/validateAuthConfig.js` |
| Page Protection | `packages/build/src/build/buildAuth/buildPageAuth.js` |
| API Protection | `packages/build/src/build/buildAuth/buildApiAuth.js` |
| NextAuth Config | `packages/api/src/routes/auth/getNextAuthConfig.js` |
| Providers | `packages/api/src/routes/auth/createProviders.js` |
| Session Callback | `packages/api/src/routes/auth/callbacks/createSessionCallback.js` |
| JWT Callback | `packages/api/src/routes/auth/callbacks/createJWTCallback.js` |
| Authorization | `packages/api/src/context/createAuthorize.js` |
| _user Operator | `packages/plugins/operators/operators-js/src/operators/shared/user.js` |
| API Route | `packages/servers/server/pages/api/auth/[...nextauth].js` |

## Security Considerations

1. **404 for Unauthorized**: Returns 404 instead of 403 to hide existence
2. **Session Hashing**: `hashed_id` for privacy-preserving analytics
3. **Role Checking**: Array-based role matching
4. **Secret Operator**: `_secret` for credentials in config
5. **PKCE & State**: OAuth security via Auth.js
6. **Cookie Security**: Configurable via `auth.advanced.cookies`
