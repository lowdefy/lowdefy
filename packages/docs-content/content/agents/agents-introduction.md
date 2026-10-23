# Agents

Lowdefy agents add AI chat capabilities to your app. An agent connects to an AI model provider (like Anthropic, OpenAI, or Google), can use tools to interact with your app's APIs, and streams responses to an [`AgentChat`](/AgentChat) block in the browser.

Agents are defined at the root of your Lowdefy configuration, alongside `connections` and `pages`. You define the agent in YAML, and Lowdefy handles the streaming, tool execution, and UI.

## Quick Start

A connection, an agent, and a chat block — that's all you need:

```yaml
lowdefy: 7.0.0

connections:
  - id: anthropic
    type: Anthropic
    properties:
      apiKey:
        _secret: ANTHROPIC_API_KEY

agents:
  - id: assistant
    type: ClaudeAgent
    connectionId: anthropic
    properties:
      model: claude-sonnet-4-20250514
      instructions: |
        You are a helpful assistant for Acme Corp. Answer questions
        about our products and services. Be friendly and concise.

pages:
  - id: chat
    type: PageHeaderMenu
    properties:
      title: Chat
    blocks:
      - id: chat
        type: AgentChat
        properties:
          agentId: assistant
```

Set the `ANTHROPIC_API_KEY` [secret](/secrets) and you have a fully working AI chat — streaming responses, markdown rendering, code highlighting, and editable messages all work out of the box.

## How Agents Work

When a user sends a message in an [`AgentChat`](/AgentChat) block:

1. The message is sent to the Lowdefy server via a streaming API endpoint.
2. The server loads the agent configuration, creates a connection to the AI provider, and starts a conversation with the model.
3. If the agent has tools, the model can call them. Tool calls execute server-side (API endpoints, MCP servers, or sub-agents) and the results are sent back to the model.
4. The model's response streams back to the browser in real time, updating the chat UI as tokens arrive.

This tool loop continues until the model produces a final text response or reaches the `maxSteps` limit.

## Agent Definition

Agents are defined in the top-level `agents` array in your Lowdefy configuration:

- `id: string`: __Required__ - A unique identifier for the agent.
- `type: string`: __Required__ - The agent type. See [Anthropic](/Anthropic), [OpenAI](/OpenAI-connection), and [Google](/Google) for available types.
- `connectionId: string`: __Required__ - The `id` of the connection to use.
- `properties: object`: Model, instructions, and behavior settings. See [Agent Properties](/agent-properties). __Operators are evaluated__.
- `tools: array`: API endpoint tools. See [Endpoint Tools](/agent-endpoint-tools).
- `mcp: array`: MCP server tools. See [MCP Tools](/agent-mcp-tools).
- `agents: array`: Sub-agent tools. See [Multi-Agent](/agent-multi-agent).
- `hooks: object`: Server-side lifecycle hooks. See [Server Hooks](/agent-server-hooks).
- `redact: object`: Patterns the server masks in the user's messages. See Redacting User Messages below. __Operators are evaluated__.

###### Agent with tools, sub-agents, and hooks:
```yaml
agents:
  - id: support_agent
    type: ClaudeAgent
    connectionId: anthropic
    properties:
      model: claude-sonnet-4-20250514
      instructions: |
        You are a customer support agent. Help users find products
        and answer questions. Be friendly and concise.
      maxSteps: 5
    tools:
      - search-products
      - endpointId: create-ticket
        confirm: true
    mcp:
      - mcp_knowledge_base
    agents:
      - agentId: billing_agent
        description: Handles billing and payment questions.
    hooks:
      onFinish:
        - save-conversation
```

## Redacting User Messages

`redact` masks text in the user's messages on the server before anything else sees it: the model, title generation, tools and the [server hooks](/agent-server-hooks) that save the conversation. Use it to keep personal information, like ID numbers or email addresses a user pastes into the chat, away from the AI provider and out of chat history, as data protection laws such as POPIA or GDPR require.

- `redact: object`:
  - `patterns: array`: __Required__ - The patterns to mask, at least one. Each is a regular expression string, or an object:
    - `pattern: string`: __Required__ - The regular expression.
    - `name: string`: A name for the pattern. The server's debug log counts replacements by name, never logging the matched text.
    - `flags: string`: Regular expression flags, such as `i`. `g` is always added, so every match is masked. The sticky flag `y` is refused.
  - `replacement: string`: Default: `'[removed]'` - The text each match is replaced with.

The server masks the text of every user message, not only the newest: the browser sends the whole conversation with each turn. The model's replies, tool calls and results, and attached files are left as they are. `redact` applies to chat turns: a sub-agent's `redact` is not applied when another agent calls it, and the `CallAgent` routine step does not use it. The chat in the browser still shows what the user typed. A conversation the browser saves through its own endpoints is not masked by `redact`, so mask it in those endpoints too, for example with [`_string.replace`](/_string).

The patterns can come from a module var, resolved at build, or from a runtime operator such as `_secret`, evaluated with each request. The build checks a pattern written in the config; a pattern an operator returns is checked when the request runs, and an invalid one fails the turn with a config error. A pattern that matches empty text, such as `\d*`, is refused, since it would put the replacement between every character.

Patterns run in the order they are listed, each on the text the ones before it left. Put the longer patterns first: listed before an ID number pattern, a short pattern such as `\d{4}` would split the number into blocks and leave its last digits. Avoid patterns that can match the replacement text itself, like `\w+`.

###### Mask ID numbers, phone numbers and email addresses (POPIA):
```yaml
agents:
  - id: support_agent
    type: ClaudeAgent
    connectionId: anthropic
    properties:
      model: claude-sonnet-4-20250514
    redact:
      replacement: '[removed]'
      patterns:
        - name: email
          pattern: '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
        - name: id_number
          pattern: '\d(?:[ -]?\d){8,}'
    hooks:
      onFinish:
        - save-conversation
```

A user who types `My ID is 8001015009087, email me at jo@example.com` reaches the model, and the `save-conversation` hook, as `My ID is [removed], email me at [removed]`.

## Beyond Chat

Agents can also run headlessly from [API endpoint routines](/api) using the `CallAgent` step — the agent loops through its tools to completion and the result lands in the routine's `_step` results, no chat UI involved. The step can pass images and documents beside its prompt with `files`. See [Running Agents As A Routine Step](/api) for details.

## What's Next

- [Agent Properties](/agent-properties) — Configure model, temperature, pruning, and more.
- [Endpoint Tools](/agent-endpoint-tools) — Give the agent access to your database and APIs.
- [MCP Tools](/agent-mcp-tools) — Connect to external tool providers via the MCP standard.
- [Multi-Agent](/agent-multi-agent) — Delegate tasks to specialized sub-agents.
- [Server Hooks](/agent-server-hooks) — Save conversations, generate titles, and run server-side logic.
- [AgentChat](/AgentChat) — Configure the chat UI block.
- [AgentConversations](/AgentConversations) — Add a conversation history sidebar.
