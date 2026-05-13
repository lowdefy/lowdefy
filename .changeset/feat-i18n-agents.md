---
'@lowdefy/ai-utils': minor
'@lowdefy/api': minor
'@lowdefy/blocks-antd-x': minor
'@lowdefy/build': minor
'@lowdefy/client': minor
'@lowdefy/helpers': minor
'@lowdefy/server': minor
'@lowdefy/server-dev': minor
---

feat: Extend i18n coverage to Lowdefy agents.

Builds on the i18n / locale support from
`feat-i18n-locale-support.md`. End-user-visible strings in the agent
runtime and the `AgentChat` block now localize automatically when
`config.i18n` is configured.

**Agent runtime errors.** HTTP 4xx/5xx responses from the agent
endpoint (`Only POST requests are supported.`, `Invalid agent path`,
`Agent "X" does not exist.`, `Agent type "Y" can not be found.`,
`Endpoint execution failed`, etc.) translate per request via the
`Accept-Language` header against `agent.runtime.*` builtin keys.

**AgentChat block UI.** Framework-rendered strings in the chat UI go
through `methods.translate` against new `agent.*` builtin keys:

- `agent.sender.placeholder` — `'Type a message...'`
- `agent.toolApproval.{approve,reject}` — `'Approve'` / `'Reject'`
- `agent.message.{copy,feedback,regenerate,delete}` — message actions
- `agent.toolResult.{completed,completedNoData,empty,emptyList,showMore,showLess}` — tool result captions

Override per locale via `config.i18n.messages.{locale}` — same
mechanism as any other built-in message.

**antd X locale wiring.** The app shell now uses
`@ant-design/x@2.7.x`'s `XProvider` at the root (drop-in superset of
antd's `ConfigProvider`) with a merged antd + antd-X locale pack.
antd X ships only `en_US` and `zh_CN` packs; other locales fall back
to `en_US` for X-native strings (`'New chat'`, `'Stop loading'`,
`'Like'`/`'Dislike'`, bubble edit `'OK'`/`'Cancel'`). Apps can
override these in unsupported locales via the new `agent.antdx.*`
reference keys.

**Plugin-author surface.** Agent hook endpoints (`onStart`,
`onStepStart`, `onToolCallStart`, `onToolCallFinish`, `onStepFinish`,
`onFinish`) now receive `locale: <activeCode>` in their payload, so
hook routines can branch on the user's locale.

**System prompt translation.** `agent.properties.instructions` passes
through the operator parser at request time — `_t:` works there for
locale-aware system prompts.

```yaml
agents:
  - id: assistant
    type: AISDKAgent
    connectionId: anthropic
    properties:
      agent:
        model: claude-sonnet-4
        instructions:
          _t: agent.systemPrompt
```

**What stays English** (explicit choices):

- Built-in tool descriptions used in the model prompt (English-trained
  models perform best with English tool descriptions).
- Build-time agent validation errors (developer diagnostics).
- Console warnings (ops diagnostics).
- The `[File truncated — showing first NKB...]` notice in the
  `read-file` built-in tool (model-facing).
- Model-streamed natural-language output (owned by the model).
