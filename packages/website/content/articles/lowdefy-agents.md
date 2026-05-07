---
title: 'Lowdefy Agents'
subtitle: 'A Lowdefy app can now run AI agents that call your existing endpoints as tools'
authorId: 'machiel'
publishedAt: '2026-05-05'
readTimeMinutes: 10
tags:
  - 'Release'
  - 'Agents'
  - 'AI'
draft: false
---

A Lowdefy app can now run AI agents that call your existing endpoints as tools. Add a provider connection and an agent to your app config, drop an [`AgentChat`](https://docs.lowdefy.com/AgentChat) block on a page, and you have streaming chat wired to the API you already have. The same endpoint a button calls when a user clicks it can be called by the model mid-conversation: same routine, same connections, same auth context, same operators.

The agent's model, system instructions, tool list, and loop limits all live in YAML alongside your existing connections, endpoints, and pages. The `AgentChat` block is built on [Ant Design X](https://x.ant.design/) and ships streaming, message rendering, tool-call display, attachments, and tool approval out of the box. Multi-provider support, MCP servers, sub-agents, and bidirectional page-state sync sit in the same shape as the simplest chat.

## What an agent is

An agent is a language model that uses tools in a loop. Hand it a goal in plain English ("find me a laptop under $1000") and it picks which tools to call, reads each result, and decides what to do next. The loop ends when the model gives a final answer without calling another tool, or when it hits a step limit you set.

That's the difference from a one-shot prompt. A one-shot prompt returns text. An agent picks its own path through tools and stops on its own. Three things shape that path: the model, the system instructions that set the goal and constraints, and the tool list that defines what the agent can do.

Lowdefy spreads that definition across four places, each with a different responsibility:

| Layer      | Responsibility                              | Lowdefy key    |
| ---------- | ------------------------------------------- | -------------- |
| Connection | Provider credentials                        | `connections`  |
| Agent      | Model, instructions, tools, loop control    | `agents`       |
| Tool       | What the model can call to act on the world | `api`          |
| Block      | The chat UI                                 | `pages.blocks` |

Each layer has its own job. Connections hold credentials, separate from any individual agent. Agents are reusable behavior: define one, drop it into any page. Endpoints already exist in Lowdefy as the way you call backend logic from a button or another routine; adding two fields makes them callable by a model as well. Blocks stay pure UI, with no AI-specific config of their own. A block references an agent by ID and renders whatever messages come back.

## Adding an agent

### A chatbot in around thirty lines

```yaml
plugins:
  - name: '@lowdefy/connection-anthropic'
    version: 5.3.0

connections:
  - id: claude
    type: Anthropic
    properties:
      apiKey:
        _secret: ANTHROPIC_API_KEY

agents:
  - id: chat_bot
    type: ClaudeAgent
    connectionId: claude
    properties:
      model: claude-haiku-4-5-20251001
      instructions: You are a helpful assistant. Keep responses concise.

pages:
  - id: chat
    type: PageHeaderMenu
    properties:
      title: Chat
    blocks:
      - id: chat
        type: AgentChat
        properties:
          agentId: chat_bot
          welcome:
            title: Chat
            description: Ask me anything
```

Drop your Anthropic API key into a secret called `ANTHROPIC_API_KEY` and the page serves a streaming chat with markdown rendering, a welcome screen, copy-message actions, and a typing indicator while the model is generating. The `AgentChat` block ships the things you'd otherwise wire up by hand: streaming, scroll behavior, error and abort handling, role-based avatars, an empty state, file attachments. None are required config.

![Streaming chat with markdown rendering from the 30-line example](/images/articles/agent-chat.gif)

### Endpoints as tools

An agent's `tools` list is endpoint IDs. Add a `description` and a `payloadSchema` to the endpoint and it becomes eligible to be called by the model:

```yaml
api:
  - id: search-products
    type: Api
    description: Search for products by name or category.
    payloadSchema:
      type: object
      properties:
        query:
          type: string
          description: Search query
      required:
        - query
    routine:
      - id: search
        type: AxiosHttp
        connectionId: catalog_api
        properties:
          url:
            _string.concat:
              - /products/search?q=
              - _payload: query
              - '&limit=5'
      - :return:
          _step: search.data.products

agents:
  - id: product_bot
    type: ClaudeAgent
    connectionId: claude
    properties:
      model: claude-haiku-4-5-20251001
      instructions: You help users find products. Search the catalog and summarize results.
    tools:
      - search-products
```

This endpoint is a regular Lowdefy API. A button on a page can hit it through a [`CallApi`](https://docs.lowdefy.com/CallApi) action; another endpoint can compose it as a routine step. Adding `description` and `payloadSchema` doesn't change any of that. It only makes the endpoint discoverable to the model. When the agent calls it, [`_payload`](https://docs.lowdefy.com/_payload) carries the model's tool input, the same as if a page had sent it.

An agent has the same surface area as the rest of your app. Every operator, every connection, every secret, every authenticated user reference ([`_user`](https://docs.lowdefy.com/_user)) is available inside a tool's routine. An insert endpoint that writes to MongoDB is already a tool. An endpoint that calls a third-party API with a stored key is already a tool. The agent isn't a new server, it's a different caller of the server you already have.

For tools that shouldn't be exposed to the browser at all, change the type to [`InternalApi`](https://docs.lowdefy.com/InternalApi). The endpoint stops serving HTTP requests and stays callable from agents and from other endpoints:

```yaml
api:
  - id: lookup-user
    type: InternalApi
    description: Look up a user by their ID. Returns name, email, and role.
    payloadSchema:
      type: object
      properties:
        userId:
          type: number
          description: The user ID to look up
      required:
        - userId
    routine:
      - id: user
        type: AxiosHttp
        connectionId: hr_api
        properties:
          url:
            _string.concat:
              - /users/
              - _payload: userId
      - :return:
          name:
            _step: user.data.fullName
          email:
            _step: user.data.email
          role:
            _step: user.data.role
```

### MCP servers by ID

Many capabilities you'd want an agent to have already exist as MCP servers: documentation lookups, web search, Slack, GitHub, Linear. Lowdefy treats an MCP server as a connection, then lets the agent reference it the same way it references the provider:

```yaml
connections:
  - id: mcp_deepwiki
    type: Mcp
    properties:
      transport: http
      url: https://mcp.deepwiki.com/mcp

agents:
  - id: repo_bot
    type: ClaudeAgent
    connectionId: claude
    properties:
      model: claude-haiku-4-5-20251001
      instructions: You answer questions about public GitHub repos using the DeepWiki MCP server.
    mcp:
      - mcp_deepwiki
```

The agent picks up every tool the MCP server exposes: list, search, fetch, whatever the server publishes. Endpoint tools and MCP tools end up in the same pool by the time the model sees them. Streamable `http`, `sse`, and `stdio` transports are all supported — prefer `http` for anything you're going to deploy, since `stdio` spawns a child process and won't survive serverless environments.

### Tool confirmation

Some tools want a human to approve them before they run. Set `confirm: true` on the tool reference and the chat block renders an approve/reject card inline:

```yaml
agents:
  - id: leave_bot
    type: ClaudeAgent
    connectionId: claude
    properties:
      model: claude-haiku-4-5-20251001
      instructions: |
        You help with leave requests. Use search to look up policies.
        Submit only when the user agrees.
    tools:
      - search-policies
      - endpointId: submit-leave
        confirm: true
```

`search-policies` is read-only and runs immediately. `submit-leave` writes to the database, so the model's tool call surfaces in the chat as a card showing the proposed input alongside approve and reject buttons. The endpoint runs only after approval. The two forms in the `tools` list (the bare ID and the object with `endpointId`) both work. The object form unlocks per-tool flags.

### Sub-agents

An agent can have other agents as tools. Define each specialist as its own agent, then list them on the orchestrator under `agents`:

```yaml
agents:
  - id: product_researcher
    type: ClaudeAgent
    connectionId: claude
    properties:
      model: claude-haiku-4-5-20251001
      instructions: |
        Research products. Search first, then look up details for the most
        relevant matches. Summarize findings clearly.
    tools:
      - search-products
      - get-product-details

  - id: user_researcher
    type: ClaudeAgent
    connectionId: claude
    properties:
      model: claude-haiku-4-5-20251001
      instructions: Look up user information by ID and summarize.
    tools:
      - lookup-user

  - id: orchestrator_bot
    type: ClaudeAgent
    connectionId: claude
    properties:
      model: claude-sonnet-4-20250514
      instructions: |
        Coordinate specialists. Delegate product questions to product_researcher
        and user lookups to user_researcher. Synthesize results yourself.
    agents:
      - agentId: product_researcher
        description: Search and analyze products from the catalog
      - agentId: user_researcher
        description: Look up user information by ID
```

The orchestrator runs on Sonnet. The specialists run on Haiku. Each sub-agent has its own tools, its own loop limit, and its own prompt. The orchestrator sees them as plain tools, with the `description` field deciding when it delegates.

## Built-in tools

Two tool sources are injected by the framework rather than written by the developer. They appear in the same pool as endpoint, MCP, and sub-agent tools, but they aren't listed under `tools:` — the agent picks them up by virtue of other config.

### File system

Set `fileSystem.basePath` on the agent and four tools land in the pool: `read-file`, `list-files`, `search-files`, `stat-file`. Every path is resolved against the base directory and any path that escapes is rejected, so the agent can browse the directory and nothing else.

```yaml
agents:
  - id: docs_bot
    type: ClaudeAgent
    connectionId: claude
    properties:
      model: claude-haiku-4-5-20251001
      instructions: You answer questions using the knowledge base.
      fileSystem:
        basePath: ./knowledge-base
```

This is the simple way to point an agent at a corpus: a directory of markdown files, a snapshot of internal docs, a vendored SDK source tree. Reads are capped at 512 KB per file, search caps at 200 matches and skips files over 1 MB. In production builds the directory is copied into the server bundle automatically.

### Page state

The `AgentChat` block can expose a slice of page state to the agent. Declare `sharedState` on the block — an operator expression that evaluates to an object — and two things happen on the next message: the agent receives an `update-page-state` tool that lets it write back, and (when the agent has `pageContext: true`) the current values arrive in its prompt as a context block.

```yaml
agents:
  - id: form_bot
    type: ClaudeAgent
    connectionId: claude
    properties:
      model: claude-haiku-4-5-20251001
      pageContext: true
      instructions: |
        Help the user fill in the form. Read sharedState to see what's
        already entered. When the user provides new values, call
        update-page-state with an `updates` object.

pages:
  - id: form
    type: PageHeaderMenu
    properties:
      title: Form
    slots:
      content:
        blocks:
          - id: company_name
            type: TextInput
          - id: employee_count
            type: NumberInput
          - id: chat
            type: AgentChat
            properties:
              agentId: form_bot
              sharedState:
                _state: true
```

`sharedState: { _state: true }` exposes the whole page state; a curated shape like `{ company: { _state: company_name } }` exposes a subset. The block enforces an allowlist on the way back: only keys present in the original `sharedState` snapshot can be written, anything else is dropped on the client. The write applies through a synthetic `SetState`, so the form re-renders with the agent's values without any `onDataPart` handler or hook endpoint.

![Agent reading and writing page state on a form](/images/articles/page-state.gif)

`update-page-state` is a reserved name: an endpoint or sub-agent that tries to claim it is rejected when the agent runs, and an MCP server that publishes a tool with that name is skipped with a warning. The tool's description is generated at request time from the keys in the snapshot, so the agent always sees the current set of writable fields.

## Under the hood

Lowdefy's agent system runs on top of the [Vercel AI SDK](https://ai-sdk.dev/). The SDK provides the model abstraction, the tool-loop runtime, the chat streaming protocol, and the React hook the chat block uses. Lowdefy contributes the config layer and the in-process tool execution.

A provider connection wraps the SDK's provider factory for its vendor: Anthropic, OpenAI, Google, the Vercel AI Gateway, plus community providers as they appear. Provider-specific knobs like Anthropic's extended thinking or OpenAI's reasoning effort live on the agent type the connection plugin ships, and pass through to the underlying provider call.

The agent runtime takes a model, a tool list, a stop condition, and a system prompt, then runs the call-tool-call loop until the model finishes or a stop condition fires. Lowdefy hands all of this in from the agent's YAML config. Lifecycle hooks declared in YAML (`onStart`, `onStepStart`, `onToolCallStart`, `onStepFinish`, `onFinish`) become callbacks on the runtime, each one fired by calling a Lowdefy API endpoint with the event payload.

Tools come from three places: API endpoints, MCP connections, and other agents. For an endpoint tool, the runtime reads the description and `payloadSchema` directly off the endpoint config and runs the endpoint's routine in-process when the model calls the tool. The model's tool input arrives as `_payload`, with the same connection access, operators, and auth context any other endpoint call would have. MCP tools are loaded from the configured MCP servers and merged into the same tool pool. Sub-agents wrap a child agent's run inside a tool, so the parent loop calls them like any other tool.

The browser chat is driven by the SDK's chat hook, with a custom transport pointed at a Lowdefy agent route. Browser cookies authenticate the request. The route loads the agent config, runs the agent, and streams the response back unmodified. Text deltas, tool input streams, tool output, reasoning, sources, and step boundaries all arrive as structured parts. The block converts each part into an Ant Design X component and fires Lowdefy events so a page can react to message completion, tool calls, or errors without managing the stream itself.

The mapping is shallow because the primitives line up. A Lowdefy connection already does what a provider does. A Lowdefy endpoint already does what a tool's execute function does. A Lowdefy block already does what a React component does. Where Lowdefy adds something on top (bidirectional page-state sync via `sharedState`, the inline approve/reject UI for `confirm: true` tools, sub-agents as tools, the per-provider typed agent schemas), those are places where the runtime didn't have an opinion and the framework did.

Putting an agent into a Lowdefy app means writing four config keys. The runtime, the streaming protocol, and the chat hook come from one library. The tools are the endpoints you'd already have written. The chat UI is a block. When the building blocks line up, you don't write a wrapper. You write a registration.
