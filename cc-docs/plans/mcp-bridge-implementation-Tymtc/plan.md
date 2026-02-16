# MCP Bridge — Revised Architecture

## Core Insight

The Lowdefy Engine (`@lowdefy/engine`) is framework-agnostic. It manages state, events, actions, requests, and block evaluation without any dependency on React. The React client (`@lowdefy/client`) is just a rendering layer that:

1. Calls `getContext()` to create page contexts
2. Registers `updaters[blockId]` functions that trigger React re-renders
3. Mounts React components for each block
4. Wires DOM events to `block.triggerEvent()` and `block.setValue()`

The MCP bridge replaces React with a **markdown renderer** and replaces DOM events with **agent action commands**. Everything else — the Engine, the API, the operator system, auth — is reused as-is.

---

## Architecture Comparison

```
React Client (@lowdefy/client)          MCP Client (@lowdefy/mcp-client)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
initLowdefyContext()                     initMcpContext()
  lowdefy._internal.callRequest            callRequest = direct callRequest()
    = HTTP POST /api/request/                from @lowdefy/api (no HTTP)
  lowdefy._internal.updateBlock            updateBlock = no-op
    = React setState trigger                 (no UI to update)
  lowdefy._internal.displayMessage         displayMessage = append to log
    = Ant Design notification                (returned to agent)
  lowdefy._internal.link                   link = change current pageId,
    = Next.js router.push()                  run getContext for new page

getContext() ← REUSED AS-IS             getContext() ← REUSED AS-IS
  Creates page context                    Same Engine context
  Block tree (Areas/Block)                Same block tree
  State, Events, Actions, Requests        Same state management
  onInit/onInitAsync lifecycle            Same lifecycle

React render cycle                       renderPageToMarkdown()
  CategorySwitch → Component               Walk block tree
  Block mounts React component              Call block.mcpRender() on each
  DOM displays UI                           Build markdown string

User interactions                        Agent action commands
  onChange → methods.setValue()              { type: 'setValue', blockId, value }
  onClick → methods.triggerEvent()          { type: 'triggerEvent', blockId, event }
  Link click → lowdefy._internal.link       { type: 'navigate', pageId, input }
  Form submit → event chain                 { type: 'triggerEvent', blockId, event: 'onClick' }
```

---

## What Blocks Render For Agents

Each block exports a static `mcpRender` function alongside its React component. This function receives the same `block.eval` data the React component gets and returns markdown with semantic tags.

### Input Block Example (TextInput)

```javascript
TextInput.mcpRender = function mcpRender({ blockId, properties, value, required, validation, events }) {
  const label = properties.label?.title ?? properties.title ?? blockId;
  const eventList = Object.keys(events).join(', ');
  const req = required ? ' required="true"' : '';
  const status = validation?.status ? ` validation="${validation.status}"` : '';
  const errors = (validation?.errors ?? []).map(e => `  Error: ${e}`).join('\n');

  return `<input id="${blockId}" type="TextInput"${req}${status} events=[${eventList}]>
${label}${properties.placeholder ? ` — Placeholder: "${properties.placeholder}"` : ''}
Current value: ${JSON.stringify(value ?? null)}${errors ? '\n' + errors : ''}
</input>`;
};
```

**Renders as:**
```
<input id="customer_name" type="TextInput" required="true" events=[onChange]>
Customer Name — Placeholder: "Enter customer name"
Current value: null
</input>
```

### Display Block Example (Button)

```javascript
ButtonBlock.mcpRender = function mcpRender({ blockId, properties, events, loading }) {
  const title = properties.title ?? blockId;
  const eventList = Object.keys(events).join(', ');
  const loadingAttr = loading ? ' loading="true"' : '';

  return `<button id="${blockId}"${loadingAttr} events=[${eventList}]>
${title}${properties.icon ? ` [${properties.icon}]` : ''}
</button>`;
};
```

**Renders as:**
```
<button id="submit_invoice" events=[onClick]>
Submit Invoice
</button>
```

### Display Block Example (Table)

```javascript
Table.mcpRender = function mcpRender({ blockId, properties, value }) {
  const columns = properties.columns ?? [];
  const rows = value ?? [];
  const header = '| ' + columns.map(c => c.title).join(' | ') + ' |';
  const sep = '| ' + columns.map(() => '---').join(' | ') + ' |';
  const body = rows.map(row =>
    '| ' + columns.map(c => String(row[c.dataIndex] ?? '')).join(' | ') + ' |'
  ).join('\n');

  return `<display id="${blockId}" type="Table" rows="${rows.length}">
${header}
${sep}
${body || '(no data)'}
</display>`;
};
```

### Container Block Example (Card)

```javascript
Card.mcpRender = function mcpRender({ blockId, properties, areas }) {
  // areas is rendered by the MCP client's tree walker, not by the block itself
  return `<container id="${blockId}" type="Card">
${properties.title ? `## ${properties.title}` : ''}
{{areas.content}}
</container>`;
};
```

The `{{areas.content}}` placeholder is replaced by the MCP client's block tree walker with the rendered child blocks.

### Selector Block Example

```javascript
Selector.mcpRender = function mcpRender({ blockId, properties, value, required, events }) {
  const label = properties.label?.title ?? blockId;
  const options = (properties.options ?? []).map(o =>
    typeof o === 'object' ? `${o.value} (${o.label})` : String(o)
  ).join(', ');
  const req = required ? ' required="true"' : '';

  return `<input id="${blockId}" type="Selector"${req} events=[${Object.keys(events).join(', ')}]>
${label}
Options: [${options}]
Current value: ${JSON.stringify(value ?? null)}
</input>`;
};
```

### List Block Example (ControlledList)

```javascript
ControlledList.mcpRender = function mcpRender({ blockId, properties, value, list }) {
  return `<list id="${blockId}" type="ControlledList" items="${(value ?? []).length}" actions=[pushItem, removeItem, moveItemUp, moveItemDown]>
${properties.title ?? 'List'}
{{list}}
</list>`;
};
```

The `{{list}}` placeholder is replaced with numbered items, each rendered from child blocks.

---

## MCP Tool Surface

The agent gets a small, focused set of MCP tools. Not one tool per page — a universal interaction model.

### Session Tools

```
session_create({ name, description })
  → { sessionId, name }

session_list()
  → [{ sessionId, name, description, status, currentPageId, updatedAt }]

session_close({ sessionId })
  → { success }
```

### Page Tool

```
navigate({ sessionId, pageId, input? })
  → { page: <rendered markdown>, log: [...] }
```

Navigates to a page within a session. Runs `onInit`/`onInitAsync` if first visit. Returns the full page rendered as markdown.

### Interaction Tool (the main one)

```
interact({ sessionId, actions })
  → { page: <rendered markdown>, log: [...] }
```

`actions` is an array executed in order:

```json
{
  "sessionId": "sess_abc",
  "actions": [
    { "type": "setValue", "blockId": "customer_name", "value": "Acme Corp" },
    { "type": "setValue", "blockId": "amount", "value": 15000 },
    { "type": "triggerEvent", "blockId": "submit_btn", "event": "onClick" },
  ]
}
```

**Action types:**

| Action | Params | Engine equivalent |
|---|---|---|
| `setValue` | `{ blockId, value }` | `block.setValue(value)` |
| `triggerEvent` | `{ blockId, event }` | `block.triggerEvent({ name: event })` |
| `setState` | `{ params }` | `context._internal.State.set()` for each key |
| `setGlobal` | `{ params }` | `set(lowdefy.lowdefyGlobal, key, value)` |
| `navigate` | `{ pageId, input? }` | Create/load page context |
| `callApi` | `{ endpointId, payload }` | `callEndpoint()` from `@lowdefy/api` |

**Returns:**

```json
{
  "page": "<the full page re-rendered as markdown after all actions>",
  "log": [
    { "action": "setValue", "blockId": "customer_name", "success": true },
    { "action": "setValue", "blockId": "amount", "success": true },
    { "action": "triggerEvent", "blockId": "submit_btn", "event": "onClick", "success": true,
      "requestResults": [
        { "requestId": "save_invoice", "success": true, "response": { "insertedId": "inv_001" } }
      ],
      "messages": ["Invoice created successfully"]
    }
  ]
}
```

### State Inspection Tools

```
get_state({ sessionId })
  → { pageId, state: {...}, global: {...}, requests: {...} }

get_pages({ sessionId })
  → [{ pageId, title, auth }]
```

---

## Page Render Flow

When `navigate` or `interact` returns the page, the MCP client renders it by walking the block tree:

```javascript
function renderPageToMarkdown({ context, lowdefy }) {
  const rootBlock = context._internal.RootAreas.areas.root.blocks[0];
  const pageTitle = rootBlock.eval.properties?.title ?? context.pageId;

  let md = `# ${pageTitle}\n\n`;
  md += renderBlock(rootBlock, context);
  return md;
}

function renderBlock(block, context) {
  if (block.eval.visible === false) return '';

  const Component = lowdefy._internal.blockComponents[block.type];

  // If block has mcpRender, use it
  if (Component?.mcpRender) {
    let rendered = Component.mcpRender({
      blockId: block.blockId,
      properties: block.eval.properties ?? {},
      value: block.value,
      required: block.eval.required,
      validation: block.eval.validation,
      events: block.eval.events ?? {},
      loading: block.eval.loading,
    });

    // Replace area placeholders with rendered child blocks
    if (block.subAreas) {
      for (const [areaKey, subArea] of Object.entries(block.subAreas)) {
        const areaContent = (subArea.areas?.[areaKey]?.blocks ?? [])
          .map(child => renderBlock(child, context))
          .filter(Boolean)
          .join('\n\n');
        rendered = rendered.replace(`{{areas.${areaKey}}}`, areaContent);
      }
    }

    return rendered;
  }

  // Fallback: generic render based on category
  return renderGenericBlock(block);
}
```

---

## Session State Persistence

A session is a serialized Engine context. When an agent creates a session, the MCP server:

1. Creates a `lowdefy` object (like `initLowdefyContext` but server-side)
2. Persists it to the session store

When the agent resumes a session:

1. Loads the serialized state from the session store
2. Reconstructs the `lowdefy` object with restored state
3. Existing page contexts (with their `state`, `requests`, `inputs`) are restored

### Session Store Interface

```javascript
// Plugin interface — any backend that implements these methods
const sessionStore = {
  async create({ userId, name, description }) → sessionId,
  async get({ sessionId, userId }) → sessionData,
  async update({ sessionId, data }) → void,
  async list({ userId }) → [sessionSummary],
  async close({ sessionId }) → void,
};
```

### Session Data Shape

```javascript
{
  sessionId: 'sess_abc123',
  userId: 'user_456',
  name: 'Q1 Invoice Processing',
  description: 'Processing Q1 invoices for Acme Corp',
  status: 'open',
  currentPageId: 'create_invoice',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:30:00Z',

  // Serialized Engine state
  lowdefyGlobal: { ... },
  inputs: {
    'create_invoice': { templateId: 'standard' },
  },
  contexts: {
    'create_invoice': {
      state: { customer_name: 'Acme Corp', amount: 15000 },
      requests: {
        'save_invoice': [
          { response: { insertedId: 'inv_001' }, loading: false, ... }
        ],
      },
      frozenState: '<serialized initial state>',
      onInitDone: true,
    },
  },

  // Audit trail
  eventLog: [
    { timestamp: '...', action: 'setValue', blockId: 'customer_name', value: 'Acme Corp' },
    { timestamp: '...', action: 'triggerEvent', blockId: 'submit_btn', event: 'onClick' },
  ],
}
```

### Built-in Store Implementations

**Phase 1: Filesystem store** — JSON files in `.lowdefy/sessions/`. Good for dev.

**Phase 2: MongoDB store** — uses the app's existing MongoDB connection. Good for production.

Configured in `lowdefy.yaml`:

```yaml
mcp:
  enabled: true
  session:
    store:
      type: MongoDBSessionStore
      connectionId: mainDb     # Reuse existing Lowdefy connection
      properties:
        collection: mcp_sessions
```

---

## What Changes vs. Original Plan

| Original Plan | Revised Architecture |
|---|---|
| Extract tool definitions from pages at build time | No extraction — run the actual Engine headlessly |
| One MCP tool per page/form | Small universal tool set: `navigate`, `interact`, `session_*` |
| Build virtual state from tool params | Persistent session state via Engine contexts |
| McpParser class to handle `_state` | Not needed — Engine handles all operators natively |
| Modify `callRequest.js` in `@lowdefy/api` | No changes to `@lowdefy/api` |
| Page classification (action_form, query_display) | Not needed — agent sees the full page |
| `blockTypeMap` for JSON Schema generation | Not needed — blocks render themselves as markdown |
| Complex `extractInputSchema`/`extractActionPlan` | Not needed — agent reads the rendered page |

### What stays the same

- Reuse `@lowdefy/api` for request execution
- Auth parity via `createAuthorize`
- `mcpSchema`/`mcpOutput` concept → evolved into `mcpRender`
- Session management (was missing, now core)
- CLI integration (`lowdefy mcp`)

---

## Package Structure (Revised)

```
packages/servers/server-mcp/
├── package.json
├── src/
│   ├── index.js                     # Entry point — start MCP server
│   ├── createMcpServer.js           # McpServer setup with tools
│   │
│   ├── context/                     # Engine context setup (replaces React client)
│   │   ├── initMcpContext.js        # Like initLowdefyContext but no React/DOM
│   │   ├── createMcpCallRequest.js  # Direct callRequest (no HTTP)
│   │   └── createMcpLink.js         # Page navigation handler
│   │
│   ├── render/                      # Markdown rendering
│   │   ├── renderPage.js            # Walk block tree → markdown
│   │   ├── renderBlock.js           # Single block → markdown
│   │   └── genericRenders.js        # Fallback renders for blocks without mcpRender
│   │
│   ├── tools/                       # MCP tool handlers
│   │   ├── sessionTools.js          # session_create, session_list, session_close
│   │   ├── navigateTool.js          # navigate — go to a page
│   │   ├── interactTool.js          # interact — execute actions
│   │   └── stateTool.js             # get_state, get_pages
│   │
│   ├── session/                     # Session persistence
│   │   ├── SessionStore.js          # Interface definition
│   │   ├── FilesystemStore.js       # JSON file store (dev)
│   │   └── MongoDBStore.js          # MongoDB store (prod)
│   │
│   └── auth/                        # Auth bridging
│       ├── createMcpAuth.js         # Map MCP auth → Lowdefy session
│       └── filterPagesByRole.js     # Only show authorized pages
│
└── test/
    ├── renderPage.test.js
    ├── interactTool.test.js
    ├── sessionStore.test.js
    └── ...
```

Block `mcpRender` exports live in each block plugin package (co-located with the React component).

---

## Interaction Example: Full Agent Workflow

```
Agent → session_create({ name: "Invoice processing", description: "Create Q1 invoices for clients" })
← { sessionId: "sess_abc", name: "Invoice processing" }

Agent → navigate({ sessionId: "sess_abc", pageId: "create_invoice" })
← {
  page: "# Create Invoice\n\n<input id=\"customer_name\" type=\"TextInput\" required ...",
  log: [
    { action: "onInit", success: true, requests: ["load_defaults"] }
  ]
}

Agent → interact({
  sessionId: "sess_abc",
  actions: [
    { type: "setValue", blockId: "customer_name", value: "Acme Corp" },
    { type: "setValue", blockId: "amount", value: 15000 },
    { type: "setValue", blockId: "line_items", value: "[{\"item\": \"Consulting\", \"amount\": 15000}]" },
    { type: "triggerEvent", blockId: "submit_btn", event: "onClick" }
  ]
})
← {
  page: "# Create Invoice\n\n<input id=\"customer_name\" ...>\nCurrent value: \"Acme Corp\"\n</input>...",
  log: [
    { action: "setValue", blockId: "customer_name", success: true },
    { action: "setValue", blockId: "amount", success: true },
    { action: "setValue", blockId: "line_items", success: true },
    { action: "triggerEvent", blockId: "submit_btn", event: "onClick", success: true,
      requestResults: [{ requestId: "save_invoice", success: true, response: { insertedId: "inv_001" } }],
      messages: ["Invoice created successfully"] }
  ]
}

Agent → navigate({ sessionId: "sess_abc", pageId: "view_invoices" })
← {
  page: "# Invoices\n\n<display id=\"invoice_table\" type=\"Table\" rows=\"1\">\n| Customer | Amount | Status |\n...",
  log: [{ action: "onInit", success: true }]
}

Agent → session_close({ sessionId: "sess_abc" })
← { success: true }
```

---

## Implementation Phases (Revised)

### Phase 1: Core MCP Client

1. `initMcpContext` — Engine context without React/DOM
2. `createMcpCallRequest` — direct `callRequest` from `@lowdefy/api`
3. `renderPage`/`renderBlock` — block tree → markdown
4. Generic fallback renders for all block categories
5. `interactTool` — execute action list, return rendered page + log
6. `navigateTool` — page navigation with `onInit` lifecycle
7. Filesystem session store (dev)

### Phase 2: Block mcpRender Exports

Add `mcpRender` to all core block plugins:
- Input blocks: TextInput, NumberInput, Selector, DateSelector, Switch, TextArea, AutoComplete, etc.
- Display blocks: Button, Markdown, Statistic, Table, etc.
- Container blocks: Box, Card, PageSiderMenu, Tabs, Modal, etc.
- List blocks: ControlledList, TimelineList

### Phase 3: Session Persistence + Auth

- MongoDB session store
- API key and JWT auth
- Role-based page filtering
- Session event log / audit trail

### Phase 4: CLI + Dev Mode

- `lowdefy mcp` command
- Dev mode auto-restart on config changes
- MCP Inspector integration

---

## Changes to Existing Packages

### Block plugins — Add `mcpRender` static export

Each block gets a `mcpRender` function. This is additive — no changes to existing React rendering.

### `@lowdefy/build` — Extend schema

Add `mcp` to top-level `lowdefySchema.js`. Additive, backwards-compatible.

### `@lowdefy/engine` — No changes

The Engine is already framework-agnostic. Used as-is.

### `@lowdefy/api` — No changes

`callRequest` and `callEndpoint` are called directly, not via HTTP. The MCP client constructs the same `context` object that `apiWrapper` creates.

### `@lowdefy/client` — No changes

The React client is untouched. The MCP client is a parallel implementation, not a modification.
