---
'@lowdefy/ai-utils': minor
'@lowdefy/docs-content': patch
---

feat(ai-utils): Agent titles come from the first exchange and use the agent's gateway options

An agent with `generateTitle: true` made its title call without the agent's `providerOptions`. An agent set to zero data retention and pinned to one provider through the AI Gateway still sent the user's first message to the gateway on default routing and retention for the title. The title call now carries the agent's AI Gateway options (`providerOptions.gateway`: zero data retention, `only`, `order` and the rest of its routing). Provider settings such as Anthropic thinking or OpenAI reasoning effort stay off the title call, since a reasoning model would spend the title's short token cap and return no title.

The title is also generated from the first exchange, the user's first message and the first 1,200 characters of the assistant's first reply, instead of the first message alone. When a chat offers suggested prompts, many conversations open with the same question and all got the same title; the reply is where the subject is. The title is generated once the first reply is complete, before the response stream closes, so the `data-chat-title` part, and the AgentChat block's `onTitleGenerated` event, now arrive after the reply instead of alongside it.
