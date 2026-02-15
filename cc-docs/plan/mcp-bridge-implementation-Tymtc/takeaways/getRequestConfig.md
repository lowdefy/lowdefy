# getRequestConfig — Key Takeaways for MCP Bridge

**File:** `packages/api/src/routes/request/getRequestConfig.js`

## What It Does

Loads a request's build-time configuration from the build artifacts directory.

## The Code

```javascript
async function getRequestConfig({ logger, readConfigFile }, { pageId, requestId }) {
  const request = await readConfigFile(`pages/${pageId}/requests/${requestId}.json`);
  if (!request) {
    const err = new ConfigurationError(`Request "${requestId}" does not exist.`);
    throw err;
  }
  return request;
}
```

## File Path Pattern

Requests are stored at: `.lowdefy/build/pages/{pageId}/requests/{requestId}.json`

This means the MCP bridge needs `readConfigFile` on its context — it reads from the same build directory. The existing `apiWrapper` sets this up via the Next.js server. The MCP bridge needs its own equivalent.

## MCP Bridge Implication

The MCP bridge must:
1. Know the build directory path
2. Have a `readConfigFile` function that reads JSON from it
3. The build artifacts must exist (i.e., `lowdefy build` must have been run)

This is why the MCP server needs the build step to complete before it can start — it reads the same artifacts the web server reads.

## Security Note

`getRequestConfig` throws `ConfigurationError` (maps to 404) rather than a "forbidden" error. This prevents information leakage — an unauthorized user can't tell if a request exists. The MCP bridge should preserve this behavior.
