# Lowdefy MCP Bridge — Implementation Plan

## Executive Summary

Add a new package `@lowdefy/server-mcp` that reads the same build artifacts as the existing Lowdefy server and exposes the app's capabilities as MCP tools. The bridge reuses the existing `@lowdefy/api` request execution pipeline — `callRequest()` and `callEndpoint()` — and adds a new build step to generate MCP tool definitions from the page/block/request config.

---

## Critical Analysis: What Works and What Doesn't

### What maps cleanly

| Lowdefy pattern | MCP mapping |
|---|---|
| Page with input blocks + submit button triggering `Request` actions | **MCP tool** — inputs become params, requests execute server-side |
| API endpoints (the `api:` config section with routines) | **MCP tool** — already headless, already server-side |
| Connections + requests (direct) | **MCP tool** — request execution already works without a browser |
| Auth roles / page protection | **MCP tool filtering** — same `authorize()` function |
| Read-only pages with request data (dashboards) | **MCP resource** — expose query results |

### What does NOT map cleanly (hard problems)

1. **`_state` operator in request properties.** Request configs like `{ query: { name: { _state: customer_name } } }` reference browser state. The MCP bridge has no browser state — it must inject tool parameters into a virtual state object and pass that to the ServerParser. The ServerParser does NOT normally have `_state` — it's a WebParser-only operator. This is the biggest architectural challenge.

2. **Client-side operator resolution.** The `payload` field on requests uses operators that are parsed client-side by WebParser before being sent to the server. The server receives the already-resolved payload. The MCP bridge needs to either: (a) run a subset of WebParser server-side, or (b) construct the payload directly from tool parameters, bypassing operators.

3. **Complex multi-step forms.** A page with tabs, steps, or conditional visibility (block A visible only when block B has value X) creates a state machine that doesn't have a single "fill and submit" shape. These pages may need to be excluded or manually annotated.

4. **List blocks.** `ControlledList` creates repeating input groups with array indices. Mapping these to JSON Schema `array` of `object` is possible but adds complexity.

5. **Blocks with side effects.** `onInit` / `onInitAsync` events that load data before the form is interactive. The bridge would need to simulate this lifecycle.

6. **Selector options from requests.** A `Selector` block whose `options` come from a `_request` operator requires executing a prior request to know valid values. The tool schema can't statically enumerate options.

7. **Action chains with UI-only actions.** Chains like `Validate → SetState → Request → Link → DisplayMessage` include actions that are meaningless without a UI. The bridge must filter to executable actions.

### Design decisions to resolve these

| Problem | Decision |
|---|---|
| `_state` not available server-side | **Create an `McpParser`** that extends ServerParser with `_state` support, where state is populated from MCP tool parameters |
| Client-side payload resolution | **Use McpParser** to evaluate the same payload operators server-side, with tool params as state |
| Complex multi-step forms | **Phase 1: skip.** Only auto-generate tools for pages with clear submit patterns. Add `mcp.exclude: true` block annotation for opt-out. Phase 2: support explicit `mcp.tools` config for manual tool definitions |
| List blocks | **Map to JSON Schema `array` type** with item schema derived from the list's child input blocks |
| onInit requests | **Execute automatically** when the tool is called, before processing the main action chain |
| Dynamic selector options | **Leave as `string` type** in schema with description noting valid values come from the app. Optionally expose a companion query tool |
| UI-only actions | **Filter to executable subset**: `Request`, `SetState`, `SetGlobal`, `Validate`, `Throw`, `CallAPI`. Skip: `Link`, `ScrollTo`, `SetFocus`, `DisplayMessage`, `CopyToClipboard` |

---

## Architecture

```
                    ┌──────────────────────────────────────┐
                    │         lowdefy.yaml config           │
                    └─────────────┬────────────────────────┘
                                  │
                    ┌─────────────▼────────────────────────┐
                    │       @lowdefy/build                   │
                    │  (existing + new buildMcp step)        │
                    └───┬─────────────────────────┬────────┘
                        │                         │
              ┌─────────▼──────────┐   ┌──────────▼──────────┐
              │  .lowdefy/build/   │   │  .lowdefy/build/     │
              │  (existing)        │   │  mcp/                │
              │  pages/, conn/,    │   │  tools.json          │
              │  auth.json, etc.   │   │  resources.json      │
              └─────────┬──────────┘   └──────────┬───────────┘
                        │                         │
           ┌────────────▼────────────┐  ┌─────────▼──────────────┐
           │   @lowdefy/server       │  │  @lowdefy/server-mcp   │
           │   (humans via browser)  │  │  (agents via MCP)      │
           │   Next.js runtime       │  │  Node.js + MCP SDK     │
           │   Uses @lowdefy/api     │  │  Uses @lowdefy/api     │
           └─────────────────────────┘  └────────────────────────┘
```

Key principle: **`@lowdefy/server-mcp` calls the same `callRequest()` and `callEndpoint()` functions that the Next.js server uses.** No duplication of connection handling, operator evaluation, or auth logic.

---

## Package Structure

```
packages/servers/server-mcp/
├── package.json
├── src/
│   ├── index.js                    # Entry point — start MCP server
│   ├── createMcpServer.js          # McpServer setup, tool/resource registration
│   ├── createMcpContext.js          # Build the API context (like apiWrapper but no HTTP)
│   │
│   ├── build/                      # Build-time: config → MCP definitions
│   │   ├── buildMcpTools.js        # Walk pages, extract tools from block trees
│   │   ├── extractInputSchema.js   # Block tree → JSON Schema for tool params
│   │   ├── extractActionPlan.js    # Event chain → executable action sequence
│   │   ├── classifyPage.js         # Determine page type (form, query, dashboard, etc.)
│   │   └── blockTypeMap.js         # Block type → JSON Schema type mapping
│   │
│   ├── runtime/                    # Runtime: execute MCP tool calls
│   │   ├── executeTool.js          # Main tool execution handler
│   │   ├── buildVirtualState.js    # Tool params → state object
│   │   ├── executeActionChain.js   # Walk filtered action chain server-side
│   │   ├── executeRequest.js       # Wraps @lowdefy/api callRequest
│   │   └── validateInputs.js       # Validate tool params against schema
│   │
│   ├── auth/                       # Auth bridging
│   │   ├── createMcpAuth.js        # Map MCP auth → Lowdefy session
│   │   └── filterToolsByRole.js    # Only expose authorized tools
│   │
│   └── McpParser.js                # Extended ServerParser with _state support
│
└── test/
    ├── buildMcpTools.test.js
    ├── extractInputSchema.test.js
    ├── executeTool.test.js
    └── ...
```

---

## Phase 1: Foundation (Build-Time Tool Generation)

### Step 1.1: New package scaffolding

Create `packages/servers/server-mcp/` with:
- `package.json` with dependencies: `@modelcontextprotocol/sdk`, `zod`, `@lowdefy/api`, `@lowdefy/helpers`, `@lowdefy/operators`, `@lowdefy/node-utils`
- Standard Lowdefy license header, ESM configuration

### Step 1.2: Block type → JSON Schema mapping (`blockTypeMap.js`)

Static mapping from Lowdefy block types to JSON Schema types. This is the foundation for generating tool input schemas.

```javascript
const blockTypeMap = {
  TextInput:         { type: 'string' },
  PasswordInput:     { type: 'string' },
  ParagraphInput:    { type: 'string' },
  TitleInput:        { type: 'string' },
  AutoComplete:      { type: 'string' },
  TextArea:          { type: 'string' },

  NumberInput:       { type: 'number' },

  CheckboxSwitch:    { type: 'boolean' },
  Switch:            { type: 'boolean' },

  DateSelector:      { type: 'string', format: 'date' },
  DateTimeSelector:  { type: 'string', format: 'date-time' },
  DateRangeSelector: { type: 'array', items: { type: 'string', format: 'date' } },
  MonthSelector:     { type: 'string', format: 'date' },
  WeekSelector:      { type: 'string', format: 'date' },

  Selector:          { type: 'string' },  // Enhanced with enum if static options
  ButtonSelector:    { type: 'string' },
  RadioSelector:     { type: 'string' },

  MultipleSelector:  { type: 'array', items: { type: 'string' } },
  CheckboxSelector:  { type: 'array', items: { type: 'string' } },

  // Special handling
  PhoneNumberInput:  { type: 'object', properties: { code: { type: 'string' }, phone: { type: 'string' } } },
  ControlledList:    { type: 'array' },  // Items schema from child blocks
};
```

**Critical detail:** Blocks can also export a static `mcpSchema` method for custom agent output. This is the user's request to allow blocks to export specific JS functions for agent interaction:

```javascript
// In a block plugin:
TextInput.mcpSchema = ({ properties }) => ({
  type: 'string',
  maxLength: properties.maxLength,
  description: properties.label?.title || properties.title || properties.placeholder,
});
```

If a block exports `mcpSchema`, use it. Otherwise fall back to the static `blockTypeMap`.

### Step 1.3: Page classification (`classifyPage.js`)

Walk the built page config and classify it:

```javascript
function classifyPage({ page }) {
  // Returns: 'action_form' | 'query_display' | 'mixed' | 'excluded'

  const inputBlocks = findInputBlocks(page);
  const submitEvents = findSubmitEvents(page);  // Buttons with Request actions
  const hasRequests = page.requests.length > 0;

  if (page.mcp?.exclude) return 'excluded';

  if (inputBlocks.length > 0 && submitEvents.length > 0) return 'action_form';
  if (hasRequests && inputBlocks.length === 0) return 'query_display';
  return 'mixed';
}
```

- `action_form` → MCP tool (fill inputs + execute submit)
- `query_display` → MCP resource (read-only data)
- `mixed` → Generate both a tool and resource, or require explicit `mcp.tools` config
- `excluded` → Skip

### Step 1.4: Input schema extraction (`extractInputSchema.js`)

Recursively walk the block tree and collect input blocks:

```javascript
function extractInputSchema({ page, blockTypes }) {
  const properties = {};
  const required = [];

  function walkBlocks(blocks) {
    for (const block of blocks ?? []) {
      if (isInputBlock(block, blockTypes)) {
        const schema = getBlockSchema(block, blockTypes);
        properties[block.blockId] = {
          ...schema,
          description: extractDescription(block),
        };
        if (block.required) {
          required.push(block.blockId);
        }
      }
      // Recurse into areas
      for (const area of Object.values(block.areas ?? {})) {
        walkBlocks(area.blocks);
      }
    }
  }

  walkBlocks(page.blocks ? [page] : []);
  return { type: 'object', properties, required };
}
```

`extractDescription` pulls from: `block.properties.label.title` → `block.properties.title` → `block.properties.placeholder` → `block.blockId`.

**Handling `field` property:** Blocks can have a `field` property that changes where the value is stored in state (e.g., `field: 'user.email'` stores at `state.user.email` instead of `state.blockId`). The schema must use the field path as the property key when present.

**Handling static selector options:** If a `Selector` block has `properties.options` that is a plain array (no operators), enumerate the values in the JSON Schema:

```javascript
if (block.type === 'Selector' && Array.isArray(block.properties?.options)) {
  schema.enum = block.properties.options.map(opt =>
    typeof opt === 'object' ? opt.value : opt
  );
}
```

### Step 1.5: Action plan extraction (`extractActionPlan.js`)

From a submit button's event chain, extract the executable actions:

```javascript
const EXECUTABLE_ACTIONS = new Set([
  'Request', 'Validate', 'SetState', 'SetGlobal', 'Throw', 'CallAPI', 'Reset',
]);

const SKIP_ACTIONS = new Set([
  'Link', 'ScrollTo', 'SetFocus', 'DisplayMessage', 'CopyToClipboard',
  'GeolocationCurrentPosition', 'Login', 'Logout', 'Fetch', 'Wait',
]);

function extractActionPlan({ event }) {
  const actions = (event.try || event).filter(action =>
    EXECUTABLE_ACTIONS.has(action.type)
  );
  return actions;
}
```

### Step 1.6: Build MCP tool definitions (`buildMcpTools.js`)

Orchestrates the above to produce `tools.json`:

```javascript
function buildMcpTools({ components, context }) {
  const tools = [];

  for (const page of components.pages ?? []) {
    const classification = classifyPage({ page });

    if (classification === 'excluded') continue;

    if (classification === 'action_form') {
      const inputSchema = extractInputSchema({ page, blockTypes: context.blockTypes });
      const submitEvents = findSubmitEvents(page);

      for (const submit of submitEvents) {
        const actionPlan = extractActionPlan({ event: submit.event });
        const requestIds = actionPlan
          .filter(a => a.type === 'Request')
          .map(a => a.params)
          .flat();

        tools.push({
          name: `${page.pageId}${submitEvents.length > 1 ? `_${submit.blockId}` : ''}`,
          description: buildDescription(page, submit),
          inputSchema,
          pageId: page.pageId,
          actionPlan,
          requestIds,
          auth: page.auth,
        });
      }
    }

    if (classification === 'query_display') {
      // Expose as tool that returns data (no inputs needed, or filter inputs)
      tools.push({
        name: `query_${page.pageId}`,
        description: `Query data from ${page.properties?.title || page.pageId}`,
        inputSchema: extractInputSchema({ page, blockTypes: context.blockTypes }),
        pageId: page.pageId,
        actionPlan: page.requests.map(r => ({ type: 'Request', params: r.requestId })),
        requestIds: page.requests.map(r => r.requestId),
        auth: page.auth,
      });
    }
  }

  return tools;
}
```

### Step 1.7: Add `mcp` config section to lowdefy.yaml schema

Extend the Lowdefy schema to support:

```yaml
mcp:
  enabled: true
  transport: sse          # 'stdio' | 'sse' | 'streamable-http'
  port: 3001
  tools:
    create_invoice:
      description: "Create and send a new invoice"
      confirm: true       # Require agent confirmation
    delete_customer:
      enabled: false      # Hide from agents
  resources:
    dashboard_stats:
      page: dashboard
      requests: [get_stats]
      description: "Current business metrics"
```

Also extend the block schema to support:

```yaml
blocks:
  - id: submit_btn
    type: Button
    mcp:
      exclude: true       # Exclude this event from MCP tools
      # OR
      toolName: custom_name
      description: "Custom tool description"
```

### Step 1.8: Integrate into build pipeline

Add `buildMcp()` step to `packages/build/src/build.js`, after `buildPages` and before the write phase. Add `writeMcpConfig()` to write `build/mcp/tools.json` and `build/mcp/resources.json`.

---

## Phase 2: Runtime (MCP Server + Tool Execution)

### Step 2.1: McpParser (`McpParser.js`)

Extend the ServerParser to support `_state` operator:

```javascript
import { ServerParser } from '@lowdefy/operators';

class McpParser extends ServerParser {
  constructor({ state, ...rest }) {
    super(rest);
    this.state = state;  // Virtual state from tool params
  }
}
```

The key insight: the ServerParser already receives `operators` as a plugin map. We need to include the `_state` operator (normally client-only) in the server operator set when running in MCP mode. This means creating a merged operator set that includes both server operators and the `_state` / `_input` / `_url_query` operators from the client set.

Specifically:
- Import `_state` from `@lowdefy/operators-js/operators/client`
- Wrap it to read from the virtual state object
- Register it alongside the standard server operators

### Step 2.2: Build virtual state (`buildVirtualState.js`)

Convert MCP tool parameters into a Lowdefy state object:

```javascript
function buildVirtualState({ toolParams, inputSchema }) {
  const state = {};
  for (const [key, value] of Object.entries(toolParams)) {
    set(state, key, value);  // Using @lowdefy/helpers set() for deep paths
  }
  return state;
}
```

This handles the `field` property case — if a block has `field: 'user.email'`, the tool param key is `user.email`, and `set(state, 'user.email', value)` creates the nested structure.

### Step 2.3: Execute tool (`executeTool.js`)

Main handler for MCP tool calls:

```javascript
async function executeTool({ context, toolDef, params }) {
  // 1. Build virtual state from tool params
  const state = buildVirtualState({
    toolParams: params,
    inputSchema: toolDef.inputSchema,
  });

  // 2. Validate inputs
  validateInputs({ params, schema: toolDef.inputSchema });

  // 3. Execute action chain
  const results = [];
  for (const action of toolDef.actionPlan) {
    if (action.type === 'Validate') {
      // Run validation against inputSchema (already validated above)
      continue;
    }

    if (action.type === 'Request') {
      const requestIds = Array.isArray(action.params)
        ? action.params
        : [action.params];

      for (const requestId of requestIds) {
        const result = await executeRequest({
          context,
          pageId: toolDef.pageId,
          requestId,
          state,
        });
        results.push({ requestId, ...result });
      }
    }

    if (action.type === 'SetState') {
      // Apply state mutations for subsequent actions
      const parsedParams = evaluateParams(action.params, state);
      Object.entries(parsedParams).forEach(([key, value]) => {
        set(state, key, value);
      });
    }
  }

  return results;
}
```

### Step 2.4: Execute request (`executeRequest.js`)

Wraps `@lowdefy/api`'s `callRequest`:

```javascript
import { callRequest } from '@lowdefy/api';

async function executeRequest({ context, pageId, requestId, state }) {
  // The context.payload contains the virtual state
  // so _payload operators in request properties resolve correctly
  const payload = serializer.serialize({ state });

  // Override the evaluateOperators to use McpParser with state
  context.state = state;
  context.evaluateOperators = createMcpEvaluateOperators(context);

  const result = await callRequest(context, {
    blockId: 'mcp-bridge',
    pageId,
    payload,
    requestId,
  });

  return {
    success: result.success,
    response: serializer.deserialize(result.response),
  };
}
```

**Critical detail:** The existing `callRequest` calls `evaluateOperators` which creates a ServerParser. We need to intercept this to use our McpParser instead. Two approaches:

**Option A (preferred): Override `createEvaluateOperators`.** The `callRequest` function calls `createEvaluateOperators(context)` at line 38. If we set `context.evaluateOperators` before calling `callRequest`, it gets overwritten. So instead, we provide a custom `createEvaluateOperators` that returns an McpParser-based evaluator. This requires a small modification to `callRequest` — accept an optional factory function:

```javascript
// Modified callRequest (minimal change):
context.evaluateOperators = (context.createEvaluateOperators || createEvaluateOperators)(context);
```

**Option B: Fork the evaluate step.** Create `mcpCallRequest` that reimplements the pipeline but uses McpParser. This duplicates code — avoid.

**Option C: Compose via payload.** Pack the virtual state into `context.payload` and ensure request properties use `_payload` instead of `_state`. This requires no code changes to `@lowdefy/api` but means the bridge must rewrite `_state` references to `_payload` references in request configs at build time. Fragile.

**Recommendation: Option A** with a minimal, backwards-compatible change to `@lowdefy/api`.

### Step 2.5: Create MCP context (`createMcpContext.js`)

Similar to `apiWrapper` but without HTTP req/res:

```javascript
async function createMcpContext({ buildDirectory, session }) {
  const config = await readBuildFile('config.json');
  const connections = await importModule('plugins/connections.js');
  const operators = await importModule('plugins/operators/server.js');
  const jsMap = await importModule('plugins/operators/serverJsMap.js');
  const secrets = getSecretsFromEnv();

  const context = {
    rid: uuid(),
    buildDirectory,
    config,
    connections,
    operators: mergeOperators(operators, mcpOperators),  // Add _state etc.
    jsMap,
    fileCache: new LRUCache({ maxSize: 100 }),
    logger: createLogger(),
    secrets,
    session,
    headers: {},
  };

  createApiContext(context);
  return context;
}
```

### Step 2.6: Create MCP server (`createMcpServer.js`)

```javascript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

async function createMcpServer({ buildDirectory, mcpConfig, session }) {
  const server = new McpServer({
    name: mcpConfig.name || 'lowdefy-app',
    version: mcpConfig.version || '1.0.0',
  });

  const tools = await readBuildFile('mcp/tools.json');
  const resources = await readBuildFile('mcp/resources.json');
  const context = await createMcpContext({ buildDirectory, session });

  // Filter tools by user's roles
  const authorizedTools = filterToolsByRole({ tools, session });

  for (const tool of authorizedTools) {
    const zodSchema = jsonSchemaToZod(tool.inputSchema);

    server.tool(
      tool.name,
      tool.description,
      zodSchema,
      async (params) => {
        const result = await executeTool({
          context: createFreshContext(context),  // Clone for isolation
          toolDef: tool,
          params,
        });

        return {
          content: [{
            type: 'text',
            text: formatToolResult(result),
          }],
        };
      }
    );
  }

  // Register resources (read-only data)
  for (const resource of resources ?? []) {
    server.resource(
      resource.name,
      `lowdefy://${resource.pageId}/${resource.name}`,
      async () => {
        const result = await executeQuery({ context, resource });
        return {
          contents: [{
            uri: `lowdefy://${resource.pageId}/${resource.name}`,
            mimeType: 'application/json',
            text: JSON.stringify(result),
          }],
        };
      }
    );
  }

  return server;
}
```

### Step 2.7: Server entry point (`index.js`)

```javascript
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

async function startMcpServer({ buildDirectory, transport, port, auth }) {
  const mcpConfig = await readBuildFile('mcp/config.json');
  const server = await createMcpServer({ buildDirectory, mcpConfig });

  if (transport === 'stdio') {
    const t = new StdioServerTransport();
    await server.connect(t);
  } else {
    // Streamable HTTP with Express
    const app = express();
    app.post('/mcp', async (req, res) => {
      const session = await authenticateRequest(req, auth);
      const t = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      // Rebuild server with session-specific tool filtering
      const sessionServer = await createMcpServer({ buildDirectory, mcpConfig, session });
      await sessionServer.connect(t);
      await t.handleRequest(req, res, req.body);
    });
    app.listen(port);
  }
}
```

---

## Phase 3: Auth Bridge

### Step 3.1: API key authentication

Simplest approach — map API keys to Lowdefy users/roles:

```yaml
mcp:
  auth:
    type: api_key
    keys:
      - key: sk_live_abc123
        roles: [admin]
        user:
          name: "API Service Account"
          email: "api@company.com"
      - key: sk_live_def456
        roles: [sales]
        user:
          name: "Sales Bot"
```

The bridge reads the `Authorization: Bearer <key>` header, looks up the matching entry, and constructs a Lowdefy session object:

```javascript
function authenticateApiKey({ apiKey, mcpAuthConfig }) {
  const entry = mcpAuthConfig.keys.find(k => k.key === apiKey);
  if (!entry) throw new Error('Invalid API key');

  return {
    user: {
      ...entry.user,
      roles: entry.roles,
    },
  };
}
```

### Step 3.2: OAuth/JWT passthrough

For apps using real auth, the MCP bridge can accept a JWT from the same provider and validate it:

```yaml
mcp:
  auth:
    type: jwt
    issuer: https://accounts.google.com
    audience: my-app-client-id
```

This uses the same NextAuth session validation. The bridge calls `getServerSession()` or validates the JWT directly.

### Step 3.3: Tool filtering by role

```javascript
function filterToolsByRole({ tools, session }) {
  return tools.filter(tool => {
    if (tool.auth.public === true) return true;
    if (!session) return false;
    if (tool.auth.roles) {
      return tool.auth.roles.some(role =>
        (session.user?.roles ?? []).includes(role)
      );
    }
    return true;  // Authenticated is sufficient
  });
}
```

This reuses the exact same logic as `createAuthorize` in `@lowdefy/api`.

---

## Phase 4: Block-Level Agent Support

### Step 4.1: `mcpSchema` static export on blocks

Allow block plugins to export a static function that generates a better JSON Schema for MCP:

```javascript
// In TextInput.js
TextInput.mcpSchema = function mcpSchema({ properties, required }) {
  const schema = { type: 'string' };
  if (properties.maxLength) schema.maxLength = properties.maxLength;
  if (properties.placeholder) schema.examples = [properties.placeholder];
  if (properties.type === 'email') schema.format = 'email';
  if (properties.type === 'url') schema.format = 'uri';
  return schema;
};
```

```javascript
// In Selector.js
Selector.mcpSchema = function mcpSchema({ properties }) {
  const schema = { type: 'string' };
  if (Array.isArray(properties.options)) {
    const values = properties.options.map(o =>
      typeof o === 'object' ? o.value : o
    );
    const labels = properties.options.map(o =>
      typeof o === 'object' ? o.label : String(o)
    );
    schema.enum = values;
    schema.enumDescriptions = labels;
  }
  return schema;
};
```

### Step 4.2: `mcpOutput` static export on blocks

For display blocks that should return data to agents:

```javascript
// In Table.js
Table.mcpOutput = function mcpOutput({ value, properties }) {
  // Format table data for agent consumption
  return {
    columns: properties.columns?.map(c => c.title),
    rows: value,
    rowCount: value?.length ?? 0,
  };
};
```

```javascript
// In Statistic.js
Statistic.mcpOutput = function mcpOutput({ value, properties }) {
  return {
    title: properties.title,
    value: value,
    prefix: properties.prefix,
    suffix: properties.suffix,
  };
};
```

These are used when a tool returns data — instead of raw JSON, the block's `mcpOutput` formats it for agent readability.

### Step 4.3: Build-time collection of mcpSchema/mcpOutput

During `buildMcpTools`, check if the block type has `mcpSchema` or `mcpOutput` exports. These need to be available at build time, so they are imported from the block plugins:

```javascript
// In buildMcpTools.js
function getBlockSchema(block, blockPlugins) {
  const plugin = blockPlugins[block.type];
  if (plugin?.mcpSchema) {
    return plugin.mcpSchema({
      properties: block.properties ?? {},
      required: block.required,
    });
  }
  return blockTypeMap[block.type] || { type: 'string' };
}
```

---

## Phase 5: CLI Integration

### Step 5.1: `lowdefy mcp` command

Add to `@lowdefy/cli`:

```
lowdefy mcp                 # Start MCP server (stdio mode, for Claude Desktop)
lowdefy mcp --http --port 3001   # Start HTTP MCP server
lowdefy mcp --build          # Build only, don't start server
```

### Step 5.2: Dev mode integration

In `@lowdefy/server-dev`, optionally start the MCP server alongside the Next.js dev server when `mcp.enabled: true` in config. The MCP server watches for build changes and reloads tool definitions.

---

## Phase 6: API Endpoints as MCP Tools

### Step 6.1: Direct API endpoint mapping

Lowdefy's `api:` config section defines server-side routines that are ALREADY headless — they don't depend on browser state. These are the easiest to expose:

```yaml
api:
  - id: process_payment
    type: PaymentProcessor
    routine:
      - id: validate_card
        type: Request
        params: validate_card_request
      - id: charge
        type: Request
        params: charge_request
```

Maps directly to an MCP tool. The routine's input comes from `payload` (which maps to tool params via `_payload` operator).

### Step 6.2: Build step for API tools

In `buildMcpTools`, also iterate over `components.api` endpoints:

```javascript
for (const endpoint of components.api ?? []) {
  tools.push({
    name: `api_${endpoint.endpointId}`,
    description: endpoint.description || `API endpoint: ${endpoint.endpointId}`,
    inputSchema: endpoint.mcp?.inputSchema || { type: 'object' },
    endpointId: endpoint.endpointId,
    type: 'endpoint',
    auth: endpoint.auth,
  });
}
```

---

## Implementation Order & Dependencies

```
Phase 1: Foundation (build-time)
  1.1 Package scaffolding                    ← no deps
  1.2 blockTypeMap.js                        ← no deps
  1.3 classifyPage.js                        ← needs built page structure understanding
  1.4 extractInputSchema.js                  ← needs 1.2
  1.5 extractActionPlan.js                   ← no deps
  1.6 buildMcpTools.js                       ← needs 1.3, 1.4, 1.5
  1.7 Schema extension                       ← needs lowdefySchema.js understanding
  1.8 Build pipeline integration             ← needs 1.6, 1.7

Phase 2: Runtime
  2.1 McpParser                              ← needs operator system understanding
  2.2 buildVirtualState                      ← simple
  2.3 executeTool                            ← needs 2.1, 2.2, 2.4
  2.4 executeRequest                         ← needs 2.1, needs @lowdefy/api change
  2.5 createMcpContext                       ← needs apiWrapper understanding
  2.6 createMcpServer                        ← needs 2.3, 2.5
  2.7 Server entry point                     ← needs 2.6

Phase 3: Auth
  3.1 API key auth                           ← simple, needs 2.5
  3.2 JWT passthrough                        ← needs auth system understanding
  3.3 Tool filtering                         ← simple

Phase 4: Block agent support
  4.1 mcpSchema on input blocks              ← per-block changes
  4.2 mcpOutput on display blocks            ← per-block changes
  4.3 Build-time collection                  ← needs 4.1

Phase 5: CLI
  5.1 lowdefy mcp command                    ← needs Phase 2 complete
  5.2 Dev mode integration                   ← needs Phase 5.1

Phase 6: API endpoints
  6.1 Direct mapping                         ← simple extension of Phase 1
  6.2 Build step                             ← needs 6.1
```

---

## Critical Changes to Existing Packages

These are changes to existing code (not just new code). Each must be backwards-compatible.

### 1. `@lowdefy/api` — Accept custom evaluateOperators factory

**File:** `packages/api/src/routes/request/callRequest.js`

**Change:** Allow `context.createEvaluateOperators` override:

```javascript
// Line 38, change:
context.evaluateOperators = createEvaluateOperators(context);
// To:
context.evaluateOperators = (context.createEvaluateOperators ?? createEvaluateOperators)(context);
```

**Risk:** Low. Falls back to existing behavior. No behavioral change for existing code.

### 2. `@lowdefy/build` — Add buildMcp step

**File:** `packages/build/src/build.js`

**Change:** Add `buildMcp()` call after `buildPages()`, add `writeMcpConfig()` in write phase.

**Risk:** Low. Only runs when `mcp.enabled: true`. No output changes otherwise.

### 3. `@lowdefy/build` — Extend lowdefySchema

**File:** `packages/build/src/lowdefySchema.js`

**Change:** Add `mcp` property to the top-level schema and `mcp` property to block definition.

**Risk:** Low. Additive schema change. Existing configs without `mcp` are unaffected.

### 4. Block plugins — Add optional `mcpSchema` / `mcpOutput` exports

**Files:** Various blocks in `packages/plugins/blocks/`

**Change:** Add static methods to block components.

**Risk:** None. Optional static properties. No behavioral change to existing rendering.

---

## Testing Strategy

### Unit tests (per module)

- `blockTypeMap.test.js` — Verify all block types map correctly
- `classifyPage.test.js` — Test with various page shapes (form, dashboard, mixed)
- `extractInputSchema.test.js` — Test nested blocks, required fields, field property, selectors with options
- `extractActionPlan.test.js` — Test filtering, various action chains
- `buildMcpTools.test.js` — Integration of above with real page configs
- `McpParser.test.js` — Verify _state resolution from virtual state
- `buildVirtualState.test.js` — Test field mapping, nested paths
- `executeTool.test.js` — Mock callRequest, verify action chain execution
- `filterToolsByRole.test.js` — Role matching logic

### Integration tests

- Build a test Lowdefy config → run build → verify `mcp/tools.json` output
- Start MCP server → call tool → verify request executes against mock connection
- Auth flow: verify unauthorized tools are hidden

### Manual testing

- Use MCP Inspector: `npx @modelcontextprotocol/inspector node server-mcp/src/index.js`
- Connect from Claude Desktop to verify end-to-end

---

## Open Questions / Risks

1. **Operator evaluation timing.** Request properties may contain operators like `_if` that depend on state values set by earlier `SetState` actions. The bridge must evaluate these in sequence, updating virtual state between actions. This adds complexity.

2. **Request chaining.** Action chains where Request B uses the result of Request A (via `_request` operator). The bridge needs to maintain a virtual `requests` context across the action chain.

3. **Large configs.** Apps with 100+ pages will generate many MCP tools. May need tool grouping or pagination. The MCP spec doesn't have a concept of tool categories.

4. **Dynamic schemas.** Blocks whose properties contain operators (e.g., `options: { _request: get_categories }`) can't have their schemas fully resolved at build time. The tool description should note that valid values are dynamic.

5. **Build artifact format stability.** The MCP server reads JSON artifacts from `.lowdefy/build/`. If the build format changes, the MCP server must be updated in lockstep. This is mitigated by them being in the same monorepo.

6. **Performance.** Each MCP tool call creates a fresh API context. Connection setup (e.g., MongoDB client) happens per-call. May need connection pooling for HTTP transport mode.

7. **`_js` operator.** Custom JavaScript operators in configs. These are compiled at build time and mapped via `jsMap`. The McpParser needs access to the same `jsMap` — should work since it's loaded from the same build artifacts.
