# The Four Primitives

Every Lowdefy app is composed from four primitives. Learn these four ideas and you can read any Lowdefy app.

What the user sees. React components — inputs, tables, charts, containers — arranged into pages.

How the app thinks. Functions written in config that read state and shape data, re-evaluated on every change.

What happens next. Event handlers that run when users click, pages load, or values change.

Where the data lives. Server-side integrations to databases, APIs, and services, called through requests.

## How they fit together

A page is a tree of **blocks**. Blocks hold values in page **state** — a `TextInput` writes what the user types, a `Selector` writes the chosen option.

**Operators** are functions evaluated in config. They read state and context — `_state`, `_user`, `_media` — and compute the values around them: a block's visibility, a title's text, a request's query. When state changes, operators re-evaluate and the page updates.

User interaction fires **events** — a click, a page load, an input change. Each event runs a list of **actions**: `SetState` writes state, `Link` navigates, `Request` calls the server.

**Connections** define the services your app talks to — a database, an HTTP API, an AI provider. **Requests** execute against them on the server, so credentials never reach the browser. Actions trigger requests; operators read their results.

One loop, four primitives: blocks render state → events fire actions → actions set state and call requests → operators re-evaluate → blocks re-render.

## Where to go deeper

- [Blocks](/blocks) — the block object and the page tree.
- [Operators](/operators) — evaluation rules and where operators work.
- [Events and Actions](/events-and-actions) — event chains, error handling.
- [Connections and Requests](/connections-and-requests) — the server-side model.
- Or see everything in the [Reference](/reference).
