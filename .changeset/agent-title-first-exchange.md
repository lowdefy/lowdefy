---
'@lowdefy/ai-utils': minor
'@lowdefy/docs-content': patch
---

feat(ai-utils): Agent titles come from the first exchange and use the agent's gateway options

An agent with `generateTitle: true` made its title call without the agent's `providerOptions`. An agent set to zero data retention and pinned to one provider through the AI Gateway still sent the user's first message to the gateway on default routing and retention for the title. The title call now carries the agent's `providerOptions`, so AI Gateway routing and retention (zero data retention, `only`, `order`), OpenAI's `store` and Gemini's `safetySettings` apply to it. Thinking and reasoning settings are taken off and the call asks for no reasoning (`reasoning: 'none'`), with a 1,024-token cap for models that can't turn reasoning off. The title call also takes the agent's `timeout`, keeping its total and step limits, since a non-streaming call can't use a chunk limit.

The title is also generated from the first exchange, the user's first message and the first 1,200 characters of the assistant's first reply, instead of the first message alone. When a chat offers suggested prompts, many conversations open with the same question and all got the same title; the reply is where the subject is. The title is generated once the first reply is complete, alongside any `onFinish` hooks and before the response stream closes, so the `data-chat-title` part, and the AgentChat block's `onTitleGenerated` event, now arrive after the reply instead of alongside it. A first reply that waits on a tool approval or a client tool is titled when it completes, and a failed turn is no longer titled; its retry is.
