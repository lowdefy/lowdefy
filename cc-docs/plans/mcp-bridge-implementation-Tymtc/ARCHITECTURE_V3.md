# MCP Bridge — Architecture V3

**Status:** Supersedes REVISED_ARCHITECTURE.md
**Addresses:** All 14 findings in CRITICAL_REVIEW.md

---

## Core Principle

The Lowdefy Engine is framework-agnostic. It manages state, events, actions, requests, and operator evaluation. The React client (`@lowdefy/client`) is one rendering layer. The MCP bridge is a second — markdown instead of DOM, agent commands instead of clicks.

The Engine only reads `blockComponents[type].meta` — never the React component itself. This means the MCP bridge needs zero React in its dependency tree.

---

## The `lowdefy._internal` Contract

The critical review correctly identified this as underdocumented. Here is the exact contract, derived from source. The MCP bridge provides all of these:

```javascript
function initMcpContext({ buildArtifacts, user }) {
  const lowdefy = {
    // Top-level state — populated by Engine at runtime
    contexts: {},
    inputs: {},
    apiResponses: {},

    // App config — from build artifacts
    basePath: '',
    home: buildArtifacts.config.home ?? {},
    menus: buildArtifacts.config.menus ?? [],
    lowdefyGlobal: {},
    pageId: null,
    user: user ?? null,

    _internal: {
      // --- Plugin registries (pure JS, no React) ---
      operators: buildArtifacts.operators,
      actions: createMcpActions(),          // Filtered action set (see below)
      blockComponents: buildArtifacts.blockMetas, // { TextInput: { meta: { category: 'input', valueType: 'string' } }, ... }

      // --- Core callbacks ---
      callRequest: createMcpCallRequest({ buildArtifacts, user }),
      callAPI: createMcpCallAPI({ buildArtifacts, user }),
      displayMessage: ({ content, status }) => {
        mcpLog.push({ type: 'message', content, status });
        return () => {};  // Close function — required by Engine
      },
      logError: async (error) => {
        mcpLog.push({ type: 'error', message: error.message });
      },
      updateBlock: (blockId) => {
        dirtyBlocks.add(blockId);  // Track what changed — render after action chain
      },
      link: createMcpLink({ lowdefy }),

      // --- Stubs for browser-only features ---
      globals: {
        window: { location: { href: '', pathname: '', search: '', hash: '' } },
        document: null,
        fetch: globalThis.fetch,
      },
      components: {
        Icon: () => null,
        Link: () => null,
      },
      auth: {
        login: async () => {},
        logout: async () => {},
        updateSession: async () => {},
      },
      progress: { state: { progress: 0 }, dispatch: () => {} },
      updaters: {},
      initialised: true,
    },
  };
  return lowdefy;
}
```

### Why each stub works

| Property | Stub | Why it's safe |
|---|---|---|
| `displayMessage` | Appends to `mcpLog`, returns `() => {}` | Engine calls return value to close timed messages. Empty function satisfies the contract. |
| `updateBlock` | Adds to `dirtyBlocks` Set | NOT a no-op. Tracks which blocks changed so we know the tree is dirty after an action chain. |
| `globals.window` | Synthetic object | Only accessed by `getUrlQuery` action and `_location` operator. Synthetic object prevents the throw. Apps that use URL params in MCP get empty strings — documented behaviour. |
| `globals.document` | `null` | Only used by `ScrollTo`, `SetFocus`, `CopyToClipboard` actions. These are filtered out of the MCP action set. |
| `components.Icon/Link` | `() => null` | Only used by React rendering layer. Engine never calls these. |
| `auth.*` | No-ops | MCP auth is handled outside the Engine (API key / JWT on the MCP transport). The Engine's auth actions are for browser login flows. |
| `progress` | Static object | Used by Block.js for loading progress bars. The MCP bridge doesn't display progress — it reports completion in the action log. |

---

## Block Components: Only `.meta` Needed

The Engine's `Block.js` line 71:

```javascript
this.meta = this.context._internal.lowdefy._internal.blockComponents[this.type].meta;
```

It reads `.meta.category`, `.meta.valueType`, `.meta.initValue`. It never touches the React component. This means:

```javascript
// Build artifact: blockMetas.js (generated at build time)
export default {
  TextInput: { meta: { category: 'input', valueType: 'string' } },
  NumberInput: { meta: { category: 'input', valueType: 'number' } },
  Button: { meta: { category: 'display' } },
  Card: { meta: { category: 'container' } },
  Modal: { meta: { category: 'container' } },
  ControlledList: { meta: { category: 'list', valueType: 'array' } },
  // ... all 99 blocks, just meta objects
};
```

**Phase 1 consequence:** ALL blocks work in the Engine from day 1. Every block's state management, events, actions, and requests work without any `mcpRender` implementation. The `mcpRender` functions control how the page looks to the agent — not whether it works.

---

## Rendering: `mcpRender` Registry (Separate from Blocks)

The critical review identified 99 blocks and questioned feasibility. The solution: `mcpRender` functions live in the MCP package as a separate registry — not on the block components.

```
packages/servers/server-mcp/src/render/
├── renderPage.js              # Walk block tree, produce markdown
├── renderBlock.js             # Dispatch to mcpRender or fallback
├── fallbackRender.js          # Generic render by category
└── blockRenders/              # Per-block render functions
    ├── textInput.js
    ├── button.js
    ├── selector.js
    ├── table.js
    ├── card.js
    ├── controlledList.js
    ├── modal.js
    ├── tabs.js
    └── ...
```

### Why separate from blocks

1. **No changes to block plugin packages in Phase 1.** The registry is additive.
2. **Incremental coverage.** Start with 15 blocks, add more over time. Fallback handles the rest.
3. **No React dependency.** The render functions receive plain data from `block.eval`, not React props.
4. **Custom blocks work automatically.** Any block with a known `meta.category` gets the fallback render.

### The render registry

```javascript
// packages/servers/server-mcp/src/render/blockRenders/index.js
import textInput from './textInput.js';
import button from './button.js';
import selector from './selector.js';
import table from './table.js';
import card from './card.js';
import controlledList from './controlledList.js';
import modal from './modal.js';
import tabs from './tabs.js';
// ...

const blockRenders = {
  TextInput: textInput,
  TextArea: textInput,      // Reuse — same shape
  PasswordInput: textInput,
  NumberInput: textInput,
  Button: button,
  Selector: selector,
  MultipleSelector: selector,
  ButtonSelector: selector,
  RadioSelector: selector,
  CheckboxSelector: selector,
  Table: table,
  AgGridAlpine: table,
  Card: card,
  Box: card,                // Reuse — same shape
  Modal: modal,
  Drawer: modal,            // Reuse — same shape (content + open/closed)
  Tabs: tabs,
  ControlledList: controlledList,
  // ~30-40 explicit entries
};

export default blockRenders;
```

### Fallback render by category

Blocks without explicit `mcpRender` get a structural representation:

```javascript
function fallbackRender({ block, renderChildren }) {
  const { blockId, type } = block;
  const meta = block.meta;

  if (meta.category === 'input' || meta.category === 'input-container') {
    return `<input id="${blockId}" type="${type}" events=[${eventNames(block)}]>
${blockId}
Current value: ${JSON.stringify(block.value ?? null)}
</input>`;
  }

  if (meta.category === 'display') {
    const title = block.eval.properties?.title ?? blockId;
    return `<display id="${blockId}" type="${type}" events=[${eventNames(block)}]>
${title}
</display>`;
  }

  if (meta.category === 'container' || meta.category === 'input-container') {
    const title = block.eval.properties?.title;
    return `<container id="${blockId}" type="${type}">
${title ? `**${title}**\n` : ''}${renderChildren(block)}
</container>`;
  }

  if (meta.category === 'list') {
    return `<list id="${blockId}" type="${type}" items="${(block.value ?? []).length}" actions=[pushItem, removeItem]>
${renderChildren(block)}
</list>`;
  }

  return `[${type}: ${blockId}]`;
}
```

**Result:** ALL 99 blocks render from day 1. 30-40 get rich semantic rendering. The rest get structural rendering (type, id, value, events). This is enough for an agent to understand and interact with any page.

### Coverage tiers

| Tier | Blocks | Rendering | Phase |
|---|---|---|---|
| **Rich** | TextInput, NumberInput, Button, Selector variants, Table, Card, Box, Switch, TextArea, Markdown, Paragraph, Title, ControlledList, DateSelector | Full semantic markup with labels, options, validation, hints | Phase 1 |
| **Structural** | Modal, Drawer, Tabs, Collapse, Layout, Label, all remaining containers | Category-based rendering with content areas | Phase 1 (fallback) |
| **Data-only** | AgGrid variants, EChart, GoogleMaps, ColorSelector | JSON representation of value/config | Phase 1 (fallback) |
| **Hidden** | Loaders, Skeleton, Spinner, QR scanner | Omitted from output (no user-facing data) | Phase 1 |

### Modal/Drawer/Tabs — handling internal state

The critical review flagged that Modal/Drawer use React `useState` internally. Correct. The MCP bridge solves this differently:

**Modal/Drawer:** Always render the content. The agent doesn't need to "open" a modal — it can see and interact with the content directly. If `visible: false` on the modal block, it's hidden. If visible, the content renders like any container.

The block's `callMethod('toggleOpen')` action from event chains still fires in the Engine — it just doesn't affect rendering because there's no React state to toggle. If a modal must be state-dependent, use `visible` operators (`_state`) instead of React internal state.

**Tabs:** Render all tab panels with headers. The agent interacts with content in any tab directly. Alternatively, a `tabs.js` render function can show only the "active" tab (tracked via a state key) and list available tabs.

```javascript
function tabsRender({ block, renderChildren }) {
  const tabs = Object.keys(block.areas ?? {});
  const active = block.eval.properties?.activeKey ?? tabs[0];
  let md = `<tabs id="${block.blockId}" active="${active}" tabs=[${tabs.join(', ')}]>\n`;
  for (const tabKey of tabs) {
    const isActive = tabKey === active;
    md += `<tab key="${tabKey}"${isActive ? ' active' : ''}>\n`;
    md += renderChildren(block, tabKey);
    md += `\n</tab>\n`;
  }
  md += `</tabs>`;
  return md;
}
```

---

## API Context Construction

The critical review correctly noted this is non-trivial. Here's the exact implementation:

```javascript
// packages/servers/server-mcp/src/context/createMcpApiContext.js

import { createApiContext } from '@lowdefy/api';
import { v4 as uuid } from 'uuid';

function createMcpApiContext({ buildArtifacts, user }) {
  // Build artifacts loaded once at MCP server startup:
  //   config, connections, operators, jsMap — from .lowdefy/build/plugins/
  //   secrets — from getSecretsFromEnv()
  //   fileCache — shared LRUCache

  return function mcpApiContext({ state, payload }) {
    const context = {
      rid: uuid(),
      buildDirectory: buildArtifacts.buildDirectory,
      config: buildArtifacts.config,
      connections: buildArtifacts.connections,
      fileCache: buildArtifacts.fileCache,
      headers: {},
      jsMap: buildArtifacts.jsMap,
      logger: buildArtifacts.logger,
      operators: buildArtifacts.serverOperators,
      req: null,
      res: null,
      secrets: buildArtifacts.secrets,
      session: user ? { user } : undefined,
    };
    createApiContext(context);
    // Inject session state for operator evaluation
    context.state = state ?? {};
    return context;
  };
}
```

This is ~30 lines. The `buildArtifacts` object is loaded once at MCP server startup (same imports the Next.js server does). `createApiContext` adds `authorize`, `readConfigFile`, `user`, `steps` — we don't reimplement those.

### `createMcpCallRequest`

```javascript
function createMcpCallRequest({ buildArtifacts, user }) {
  const makeApiContext = createMcpApiContext({ buildArtifacts, user });

  return async function mcpCallRequest({ blockId, pageId, payload, requestId }) {
    // Payload arrives already-evaluated (Phase 1 eval done by Engine's WebParser)
    const apiContext = makeApiContext({ state: lowdefy.contexts[pageId]?.state });
    const { response } = await callRequest(apiContext, {
      blockId,
      pageId,
      payload: JSON.stringify(payload),
      requestId,
    });
    return { response };
  };
}
```

### `createMcpCallAPI`

```javascript
function createMcpCallAPI({ buildArtifacts, user }) {
  const makeApiContext = createMcpApiContext({ buildArtifacts, user });

  return async function mcpCallAPI({ blockId, endpointId, pageId, payload }) {
    const apiContext = makeApiContext({});
    const result = await callEndpoint(apiContext, {
      blockId,
      endpointId,
      pageId,
      payload: JSON.stringify(payload),
    });
    return result;
  };
}
```

**Finding 3 and 4 addressed.** `callAPI` exists, API context is fully constructed from build artifacts — no Next.js, no HTTP.

---

## Two-Phase Operator Evaluation

The Engine's `getContext` creates a `WebParser` at line 104:

```javascript
_internal.parser = new WebParser({ context: ctx, operators: lowdefy._internal.operators });
```

This parser evaluates `payload` operators before `callRequest`. In the browser, `lowdefy._internal.operators` includes client-only operators (`_global`, `_input`, `_request`, `_event`, `_actions`, `_url_query`, `_media`, `_location`).

**The MCP bridge provides the same operator set.** The `operators` build artifact already contains all shared operators. The bridge adds the client-only ones:

```javascript
// packages/servers/server-mcp/src/context/createMcpOperators.js

function createMcpOperators({ sharedOperators, lowdefy }) {
  return {
    ...sharedOperators,

    // Client-only operators — backed by MCP session state
    _global: ({ params, location }) =>
      get(lowdefy.lowdefyGlobal, params, { default: null }),

    _input: ({ params, location, pageId }) =>
      get(lowdefy.inputs[pageId] ?? {}, params, { default: null }),

    _request: ({ params, location, pageId }) => {
      const [requestId, ...path] = (typeof params === 'string' ? params : params.key).split('.');
      const responses = lowdefy.contexts[pageId]?.requests[requestId];
      if (!responses?.length) return null;
      return path.length ? get(responses[0].response, path.join('.'), { default: null }) : responses[0].response;
    },

    _event: ({ params }) => get({}, params, { default: null }),  // No DOM event in MCP
    _actions: ({ params, actions }) => get(actions ?? {}, params, { default: null }),
    _url_query: () => ({}),
    _media: () => ({ size: 'xl', width: 1920, height: 1080 }),
    _location: ({ params }) => get({ basePath: lowdefy.basePath, pageId: lowdefy.pageId }, params, { default: '' }),
  };
}
```

The `WebParser` in `getContext` receives these operators via `lowdefy._internal.operators`. It evaluates `payload` with full client context. Then `callRequest` on the server side runs `ServerParser` with `_state`, `_payload`, `_secret`, `_user` — unchanged.

**Finding 8 addressed.** No custom parser needed. The standard `WebParser` works with the MCP operator set.

---

## MCP Actions: Filtered Set

20 actions in `actions-core`. 4 are browser-only:

| Action | Browser-only | MCP bridge |
|---|---|---|
| CallAPI | No | Works as-is |
| CallMethod | No | Works as-is |
| CopyToClipboard | **Yes** | No-op, log warning |
| Link | No | `createMcpLink` handles navigation |
| Login | Partial | No-op (MCP auth is external) |
| Logout | Partial | No-op |
| DisplayMessage | No | Appends to mcpLog |
| Fetch | No | Works (uses `globals.fetch`) |
| GeolocationCurrentPosition | **Yes** | No-op, log warning |
| Request | No | Works via `callRequest` |
| Reset | No | Works as-is |
| ResetValidation | No | Works as-is |
| ScrollTo | **Yes** | No-op |
| SetFocus | **Yes** | No-op |
| SetGlobal | No | Works as-is |
| SetState | No | Works as-is |
| Throw | No | Works as-is |
| UpdateSession | Partial | No-op |
| Validate | No | Works as-is |
| Wait | No | Works as-is |

```javascript
function createMcpActions() {
  const browserOnlyActions = ['CopyToClipboard', 'ScrollTo', 'SetFocus', 'GeolocationCurrentPosition'];

  return Object.fromEntries(
    Object.entries(coreActions).map(([name, action]) => {
      if (browserOnlyActions.includes(name)) {
        return [name, async ({ params }) => {
          return { warning: `${name} is not available in MCP context.` };
        }];
      }
      return [name, action];
    })
  );
}
```

---

## Session Management

### What gets saved

Engine contexts are live class instances — they can't be serialised. But the DATA inside them is plain objects. Session save extracts data; restore creates fresh contexts and hydrates.

```javascript
function extractSessionData({ lowdefy }) {
  const data = {
    lowdefyGlobal: lowdefy.lowdefyGlobal,
    inputs: lowdefy.inputs,
    apiResponses: lowdefy.apiResponses,
    pageId: lowdefy.pageId,
    contexts: {},
  };

  for (const [pageId, ctx] of Object.entries(lowdefy.contexts)) {
    data.contexts[pageId] = {
      state: { ...ctx.state },
      requests: extractRequestResponses(ctx.requests),
      onInitDone: ctx._internal.onInitDone ?? false,
      onInitAsyncDone: ctx._internal.onInitAsyncDone ?? false,
    };
  }
  return data;
}

function extractRequestResponses(requests) {
  const result = {};
  for (const [requestId, responses] of Object.entries(requests)) {
    result[requestId] = (responses ?? []).map(r => ({
      response: r.response,
      loading: false,
    }));
  }
  return result;
}
```

### What gets restored

```javascript
async function restoreSession({ lowdefy, sessionData, buildArtifacts }) {
  // 1. Restore top-level state
  lowdefy.lowdefyGlobal = sessionData.lowdefyGlobal ?? {};
  lowdefy.inputs = sessionData.inputs ?? {};
  lowdefy.apiResponses = sessionData.apiResponses ?? {};
  lowdefy.pageId = sessionData.pageId;

  // 2. Rebuild page contexts from config + hydrate state
  for (const [pageId, savedCtx] of Object.entries(sessionData.contexts ?? {})) {
    const pageConfig = buildArtifacts.pages[pageId];
    if (!pageConfig) continue;

    // getContext creates fresh Block tree, State, Actions, Requests, Areas
    const ctx = getContext({ config: pageConfig, lowdefy });

    // Hydrate state — State.set() handles each key
    for (const [key, value] of Object.entries(savedCtx.state ?? {})) {
      ctx._internal.State.set(key, value);
    }

    // Hydrate request responses
    for (const [requestId, responses] of Object.entries(savedCtx.requests ?? {})) {
      ctx.requests[requestId] = responses;
    }

    // Skip onInit/onInitAsync if they already ran
    if (savedCtx.onInitDone) {
      ctx._internal.onInitDone = true;
      ctx._internal.State.freezeState();
    }
    if (savedCtx.onInitAsyncDone) {
      ctx._internal.onInitAsyncDone = true;
    }

    // Re-evaluate all operators with restored state
    ctx._internal.update();
  }
}
```

**Finding 7 addressed.** No attempt to serialise class instances. Save extracts plain data. Restore rebuilds fresh Engine contexts, hydrates the data, and skips already-run lifecycle events. ~60 lines of focused code.

### Session store interface

```javascript
const sessionStore = {
  async create({ userId, name, description }) → { sessionId },
  async get({ sessionId, userId }) → sessionData,
  async save({ sessionId, data }) → void,
  async list({ userId, status? }) → [{ sessionId, name, description, status, pageId, updatedAt }],
  async close({ sessionId }) → void,
};
```

**Phase 1:** Filesystem store (JSON files in `.lowdefy/sessions/`).
**Phase 2:** MongoDB store using app's existing connection.

---

## MCP Tool Surface

5 core tools + 2 inspection tools:

### `session_create`

```
Input:  { name: string, description?: string }
Output: { sessionId: string, name: string }
```

Creates a new `lowdefy` context with `initMcpContext`. Saves empty session.

### `session_list`

```
Input:  {}
Output: [{ sessionId, name, description, status, pageId, updatedAt }]
```

### `session_close`

```
Input:  { sessionId: string }
Output: { success: boolean }
```

### `navigate`

```
Input:  { sessionId: string, pageId: string, input?: object }
Output: { page: string, log: array }
```

1. Load/restore session
2. Set `lowdefy.inputs[pageId]` from `input`
3. Call `getContext({ config: pageConfig, lowdefy })` — runs `onInit`/`onInitAsync` on first visit
4. Render page to markdown
5. Save session
6. Return rendered page + action log

### `interact`

```
Input:  { sessionId: string, actions: array }
Output: { page: string, log: array }
```

`actions` is an array executed in order:

```json
[
  { "type": "setValue", "blockId": "customer_name", "value": "Acme Corp" },
  { "type": "triggerEvent", "blockId": "submit_btn", "event": "onClick" }
]
```

**Action types:**

| Action | Params | Engine call |
|---|---|---|
| `setValue` | `{ blockId, value }` | `block.setValue(value)` → triggers `update()` |
| `triggerEvent` | `{ blockId, event }` | `block.triggerEvent({ name: event })` |
| `setState` | `{ key, value }` or `{ values: {} }` | `State.set(key, value)` for each |
| `setGlobal` | `{ key, value }` | `set(lowdefy.lowdefyGlobal, key, value)` |
| `navigate` | `{ pageId, input? }` | Switch page context (stops remaining actions) |
| `callMethod` | `{ blockId, method, args }` | `block.callMethod(method, args)` |

**Execution rules:**

1. Actions execute sequentially (await each).
2. `triggerEvent` awaits the full event chain (requests, catches, success actions).
3. If an event chain navigates (Link action), remaining actions are skipped. The NEW page is rendered.
4. Failures are logged per action but don't stop the chain (unless navigation occurs). The agent sees the failure in the log and decides what to do.
5. Debouncing is disabled — actions execute immediately. Documented as MCP behaviour.

**After all actions:** re-render page, save session, return markdown + log.

### `get_state`

```
Input:  { sessionId: string }
Output: { pageId, state, global, requests }
```

### `get_pages`

```
Input:  { sessionId: string }
Output: [{ pageId, title, auth }]
```

Filtered by user roles via `createAuthorize`.

---

## Rendering: The Block Tree Walker

```javascript
function renderPage({ context, lowdefy, blockRenders }) {
  const rootBlock = context._internal.RootAreas.areas.root.blocks[0];
  const pageTitle = rootBlock.eval.properties?.title ?? context.pageId;

  let md = `# ${pageTitle}\n`;
  md += `Page: ${context.pageId}\n\n`;
  md += renderBlock({ block: rootBlock, blockRenders, lowdefy, depth: 0 });
  return md;
}

function renderBlock({ block, blockRenders, lowdefy, depth }) {
  // Hidden blocks produce nothing
  if (block.eval.visible === false) return '';

  const renderFn = blockRenders[block.type] ?? fallbackRender;

  // Build render context from block.eval (plain data — no React)
  const renderCtx = {
    blockId: block.blockId,
    type: block.type,
    meta: block.meta,
    properties: block.eval.properties ?? {},
    value: block.value,
    required: block.eval.required,
    validation: block.eval.validation,
    events: block.eval.events ?? {},
    loading: block.eval.loading,
    areas: block.areas,
  };

  // Render children helper — passed to block render functions
  const renderChildren = (areaKey) => {
    const area = block.subAreas?.[0]?.areas?.[areaKey];
    if (!area?.blocks) return '';
    return area.blocks
      .map(child => renderBlock({ block: child, blockRenders, lowdefy, depth: depth + 1 }))
      .filter(Boolean)
      .join('\n\n');
  };

  // List items helper — for list blocks
  const renderListItems = () => {
    return (block.subAreas ?? [])
      .map((subArea, index) => {
        const itemBlocks = subArea.areas?.content?.blocks ?? [];
        const itemContent = itemBlocks
          .map(child => renderBlock({ block: child, blockRenders, lowdefy, depth: depth + 1 }))
          .filter(Boolean)
          .join('\n');
        return `**Item ${index}:**\n${itemContent}`;
      })
      .join('\n\n');
  };

  return renderFn({ ...renderCtx, renderChildren, renderListItems, block });
}
```

**Finding 10 addressed.** Area key rendering is handled by the `renderChildren(areaKey)` helper. List item rendering uses `renderListItems()` which iterates `block.subAreas` — each sub-area corresponds to a list item with array indices already applied by the Engine.

---

## Transport Layer

**Phase 1: Stdio transport only.** Simple, no auth needed at transport level, works with all MCP clients (Claude Desktop, CLI tools, VS Code).

```javascript
import { McpServer, StdioServerTransport } from '@modelcontextprotocol/sdk/server';

const server = new McpServer({ name: 'lowdefy-mcp', version: '1.0.0' });
// ... register tools
const transport = new StdioServerTransport();
await server.connect(transport);
```

**Phase 2: HTTP transport.** `StreamableHTTPServerTransport` for remote MCP servers. Adds:
- API key auth at transport level (before MCP protocol)
- CORS configuration
- Rate limiting (configurable requests per minute per session)
- Can run as a sidecar to the Next.js server or standalone

**Phase 3: Embedded in Lowdefy server.** The MCP server runs in the same process as the Next.js server, sharing build artifacts and connection pools.

**Finding 12 addressed.**

---

## Security

### Prompt injection

Rendered markdown includes user-generated content (form labels, table data, descriptions). If a database record contains adversarial text, the agent sees it.

**Mitigation:** Content from block values and request responses is wrapped in code fences:

```
<display id="ticket_note" type="Paragraph">
```ticket_note_value
{user-generated content here — code fence prevents LLM interpretation}
```
</display>
```

This doesn't eliminate prompt injection but makes it harder for injected text to look like structural markup.

**Documentation:** MCP bridge docs will recommend creating dedicated agent users with minimal roles. The same principle as service accounts.

### Rate limiting

**Phase 1:** Max 100 actions per `interact` call. Max 50 sessions per user. Session auto-expiry after 24h of inactivity.

**Phase 2:** Configurable in `lowdefy.yaml`:

```yaml
mcp:
  limits:
    maxActionsPerCall: 100
    maxSessionsPerUser: 50
    sessionExpiryMinutes: 1440
```

### `_secret` isolation

Secrets are only accessible by `ServerParser` (Phase 2 evaluation). The `WebParser` running in the MCP bridge has no access to `_secret`. Agent-influenced state values cannot reach secrets through operator evaluation — the two-phase separation guarantees this.

**Finding 13 addressed.**

---

## Package Structure

```
packages/servers/server-mcp/
├── package.json
├── src/
│   ├── index.js                         # Entry: load artifacts, start server
│   ├── createMcpServer.js               # Register tools on McpServer
│   │
│   ├── context/
│   │   ├── initMcpContext.js             # Build lowdefy object with stubs
│   │   ├── createMcpApiContext.js        # API context for callRequest/callEndpoint
│   │   ├── createMcpCallRequest.js       # Direct callRequest (no HTTP)
│   │   ├── createMcpCallAPI.js           # Direct callEndpoint (no HTTP)
│   │   ├── createMcpLink.js             # Page navigation handler
│   │   ├── createMcpOperators.js        # Shared + client-only operators
│   │   └── createMcpActions.js          # Filtered action set
│   │
│   ├── render/
│   │   ├── renderPage.js                # Walk block tree → markdown
│   │   ├── renderBlock.js               # Dispatch to registry or fallback
│   │   ├── fallbackRender.js            # Generic by category
│   │   └── blockRenders/
│   │       ├── index.js                 # Registry
│   │       ├── textInput.js
│   │       ├── button.js
│   │       ├── selector.js
│   │       ├── table.js
│   │       ├── card.js
│   │       ├── modal.js
│   │       ├── tabs.js
│   │       ├── controlledList.js
│   │       ├── markdown.js
│   │       ├── dateSelector.js
│   │       └── ...                      # ~25-30 files
│   │
│   ├── tools/
│   │   ├── sessionTools.js              # session_create, session_list, session_close
│   │   ├── navigateTool.js              # navigate
│   │   ├── interactTool.js              # interact
│   │   └── inspectTools.js              # get_state, get_pages
│   │
│   ├── session/
│   │   ├── extractSessionData.js        # Context → plain data
│   │   ├── restoreSession.js            # Plain data → hydrated contexts
│   │   ├── FilesystemStore.js           # Dev store
│   │   └── MongoDBStore.js              # Prod store (Phase 2)
│   │
│   └── artifacts/
│       └── loadBuildArtifacts.js         # Load config, connections, operators, etc.
│
└── test/
    ├── context/
    ├── render/
    ├── tools/
    └── session/
```

**File count: ~45 files.** The original estimate of "~15" was for a minimal prototype. The real Phase 1 implementation is ~30-35 files (excluding tests). Phase 2 adds ~10 more.

---

## Implementation Phases

### Phase 1: Working MCP Server

**Goal:** `lowdefy mcp` starts a stdio MCP server. An agent can create sessions, navigate pages, interact with blocks, and see rendered pages.

| Task | Files | Depends on |
|---|---|---|
| Load build artifacts | `artifacts/loadBuildArtifacts.js` | Existing build output |
| Init MCP context | `context/initMcpContext.js`, `createMcpOperators.js`, `createMcpActions.js` | Build artifacts |
| API context + callRequest | `context/createMcpApiContext.js`, `createMcpCallRequest.js`, `createMcpCallAPI.js` | Build artifacts |
| Link handler | `context/createMcpLink.js` | MCP context |
| Fallback block rendering | `render/fallbackRender.js` | — |
| Block tree walker | `render/renderPage.js`, `render/renderBlock.js` | fallbackRender |
| Rich renders (~15 blocks) | `render/blockRenders/*.js` | — |
| Session save/restore | `session/extractSessionData.js`, `session/restoreSession.js` | — |
| Filesystem store | `session/FilesystemStore.js` | — |
| MCP tools | `tools/sessionTools.js`, `tools/navigateTool.js`, `tools/interactTool.js`, `tools/inspectTools.js` | All above |
| MCP server entry | `index.js`, `createMcpServer.js` | All above |
| CLI command | `lowdefy mcp` in `@lowdefy/cli` | server-mcp package |
| Build schema extension | `mcp` in `lowdefySchema.js` | — |
| Block meta extraction | Build step to emit `blockMetas.js` | — |

### Phase 2: Production Readiness

- MongoDB session store
- HTTP transport with API key auth
- Rate limiting and session expiry
- Rich renders for remaining 15-20 blocks
- Dev mode with file watching

### Phase 3: Advanced

- Embedded in Lowdefy server process (shared build artifacts)
- MCP resource subscriptions (real-time data changes)
- Multi-agent session sharing
- Agent activity monitoring (session event log UI)

---

## Changes to Existing Packages

| Package | Change | Type |
|---|---|---|
| `@lowdefy/build` | Add `mcp` to `lowdefySchema.js` | Schema extension (1 line) |
| `@lowdefy/build` | Add build step to extract `blockMetas.js` from block plugins | New file (~30 lines) |
| `@lowdefy/cli` | Add `lowdefy mcp` command | New command (~20 lines) |
| Block plugins | **None in Phase 1** | — |
| `@lowdefy/engine` | **None** | — |
| `@lowdefy/api` | **None** | — |
| `@lowdefy/operators` | **None** | — |

The `mcpRender` registry lives entirely in `server-mcp`. Block plugin packages are untouched.

---

## Review Finding Resolution

| # | Finding | Severity | Resolution |
|---|---|---|---|
| 1 | Engine not fully headless | HIGH | Synthetic `globals.window`, `updateBlock` tracks dirty blocks, `displayMessage` returns close fn |
| 2 | `_internal` contract undocumented | HIGH | Full contract table with all 20+ properties and their stubs |
| 3 | `callAPI` missing | MEDIUM | `createMcpCallAPI` wraps `callEndpoint` directly |
| 4 | "No changes to API" misleading | MEDIUM | API context construction documented — ~30 lines, reuses `createApiContext` |
| 5 | Block count 99 not 40 | MEDIUM | Fallback render handles all 99. Rich renders for ~30-40. No blocks excluded. |
| 6 | ~30 blocks can't render markdown | HIGH | Fallback render by category. Modals render as containers. Tabs show all panels. Charts show data JSON. |
| 7 | Session serialisation hard | CRITICAL | Extract plain data, restore via fresh `getContext` + hydration. ~60 lines. |
| 8 | Two-phase eval complex | MEDIUM-HIGH | MCP operator set includes client-only operators. Standard `WebParser` works. |
| 9 | `interact` hides complexity | MEDIUM | Sequential execution with navigation detection, failure logging, disabled debounce |
| 10 | Content/area rendering under-spec | MEDIUM | `renderChildren(areaKey)` + `renderListItems()` helpers handle all cases |
| 11 | Business case overstates "zero changes" | LOW-MEDIUM | Honest scope: no Engine/API/Operator changes. Build schema + CLI command + block meta extraction. |
| 12 | Transport unspecified | LOW-MEDIUM | Phase 1: stdio. Phase 2: HTTP. Phase 3: embedded. |
| 13 | Security underexplored | MEDIUM | Code fences for user content, rate limits, session limits, secret isolation via two-phase eval |
| 14 | 5 tools too thin | LOW-MEDIUM | `callMethod` added for custom block methods. Tab/modal interaction via state. Events discoverable in rendered output. |
