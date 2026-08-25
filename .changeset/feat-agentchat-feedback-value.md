---
'@lowdefy/blocks-antd-x': minor
---

feat: AgentChat keeps a message's thumbs rating selected

The feedback control was write-only: it reported a rating and immediately forgot it, so the thumb un-highlighted on the next render and a rated message looked unrated. On a streaming chat that is the very next chunk.

`Actions.Feedback` is now given a `value`, held per message id for the life of the chat. Being controlled, it takes on that component's selected behaviour: the chosen thumb stays highlighted and the opposite one is hidden, and clicking the selected thumb again clears the rating and brings both back. A rating can therefore be changed, but not submitted twice by accident.

Ratings are not persisted by the block — a reload or a conversation switch starts clean. Persisting them belongs to whatever stores the conversation.
