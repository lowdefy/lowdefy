# createAuthorize — Key Takeaways for MCP Bridge

**File:** `packages/api/src/context/createAuthorize.js`

## What It Does

Creates an `authorize()` function from a session. Used to check if a user can access a page/request/endpoint.

## The Logic (complete, 18 lines)

```javascript
function createAuthorize({ session }) {
  const authenticated = !!session;
  const roles = session?.user?.roles ?? [];
  function authorize({ auth }) {
    if (auth.public === true) return true;
    if (auth.public === false) {
      if (auth.roles) {
        return authenticated && auth.roles.some((role) => roles.includes(role));
      }
      return authenticated;
    }
    throw new ServerError('Invalid auth configuration');
  }
  return authorize;
}
```

## Auth Data Shape

Every page/request/endpoint has an `auth` object (set at build time):

```javascript
{ auth: { public: true } }                    // Anyone can access
{ auth: { public: false } }                   // Must be authenticated
{ auth: { public: false, roles: ['admin'] } } // Must have 'admin' role
```

Session shape:
```javascript
{ user: { roles: ['admin', 'sales'], name: '...', email: '...' } }
```

## MCP Bridge Usage

**Tool filtering:** At MCP server startup (or per-request for HTTP), filter tools by the authenticated agent's roles. Use the exact same logic:

```javascript
function filterToolsByRole({ tools, session }) {
  const authorize = createAuthorize({ session });
  return tools.filter(tool => {
    try { return authorize({ auth: tool.auth }); }
    catch { return false; }
  });
}
```

**Request authorization:** `callRequest` already calls `authorizeRequest` internally (step 5 in the pipeline). If the session on the API context matches the agent's session, authorization happens automatically.

## Key Insight

The auth model is simple and fully reusable. The MCP bridge just needs to construct a valid `session` object from whatever auth mechanism it uses (API key, JWT, OAuth) and pass it to the API context. Everything else works.
