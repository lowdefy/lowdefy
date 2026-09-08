---
'@lowdefy/blocks-antd-x': minor
---

feat: AgentChat welcome supports in-flow teaching tracks and a setInput method

AgentChat's `welcome` config gains a `tracks` shape: labelled cards, each a column of starter prompts. Unlike the flat `prompts` welcome — which sends on click and is swapped out on the first message — a tracks welcome renders in-flow as the leading item of the message list, so it scrolls up with the conversation and stays reachable by scrolling back. A track starter fills the composer instead of sending, so a shipped default becomes an editable first draft rather than a message the user never meant to send.

The composer is now controlled, and a new `setInput` CallMethod method sets its text — so app config can seed or clear the input. Clearing after a send moved to the tail of the send handler (downstream of the `onBeforeSend` cancellation and the upload await), so a rejected or failed send leaves the user's typed text in place instead of discarding it.
