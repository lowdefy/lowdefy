---
'@lowdefy/api': minor
'@lowdefy/build': minor
'@lowdefy/docs': minor
---

feat(api): Agents mask patterns in the user's messages with `redact`

An agent's new `redact` property lists regular expressions the server masks in the text of every user message before the model, title generation, tools and `onFinish` hooks see it. Use it to keep ID numbers, email addresses and other personal information a user pastes into a chat away from the AI provider and out of chat history.

```yaml
agents:
  - id: support_agent
    type: ClaudeAgent
    connectionId: anthropic
    redact:
      replacement: '[removed]' # default
      patterns:
        - name: email
          pattern: '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'
        - '\d(?:[ -]?\d){8,}'
```

Patterns are strings or `{ name, pattern, flags }` objects, and may be operators. The build rejects a missing or empty `patterns` list, a pattern that is not a string, an invalid regular expression, the sticky flag `y` and a pattern that matches empty text; a pattern an operator returns is checked when the request runs. It applies to chat turns, not to sub-agent calls or the `CallAgent` step. Assistant messages, tool calls and files are left as they are, and the debug log counts replacements by name without the matched text.
