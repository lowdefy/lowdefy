---
'@lowdefy/api': patch
'@lowdefy/ai-utils': patch
'@lowdefy/connection-ai-gateway': patch
'@lowdefy/connection-anthropic': patch
'@lowdefy/connection-google': patch
'@lowdefy/connection-openai': patch
---

fix(api): Agents evaluate their properties for each chat, not once per server

An agent's properties are evaluated when a chat starts, so `instructions` can read the caller through `_user`, `_payload` (such as `sharedState` or `urlQuery`) or a `_nunjucks` template built from them. The evaluated properties were written back onto the agent config the server caches and shares between requests, so the first chat on a server process fixed those values for every later chat on it: a later user got an agent whose instructions held the first user's name, company or page state. An agent's MCP connections were affected the same way, so an MCP header or URL built from `_user` kept the first caller's value, and so were sub-agents' MCP connections. The values only reset when the server process restarted.

Each chat and each `CallAgent` step now evaluates the agent's properties and MCP connections for its own caller, and the cached config stays as the build wrote it. The Anthropic, OpenAI, Google and AI Gateway agents also no longer write their `providerOptions` onto the properties they are given.
