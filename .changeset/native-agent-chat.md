---
'@lowdefy/blocks-native': minor
'@lowdefy/client-native': minor
'@lowdefy/shell': minor
'@lowdefy/helpers': patch
'@lowdefy/build': patch
---

feat: A native `AgentChat` block, so an app's agent works on the phone as it does on the web

- `AgentChat` in `@lowdefy/blocks-native` talks to the same `/api/agent` route as the web block, through `@ai-sdk/react`'s `useChat`, with the web block's properties, events and methods where a phone can honour them. Replies stream in as markdown, reasoning sits behind a disclosure, tool calls are compact rows that open to their output, approvals have Reject and Approve, a failed reply has Try again, and a long press copies or regenerates. The composer sits in the Screen's footer above the keyboard, with stop while a reply streams, a new-chat button and the welcome prompts as chips. `update-page-state` writes into the page state, as on the web.
- `threads: { module: ai-assistant, scope }` keeps the conversations through the ai-assistant module's endpoints: the chat resumes the thread last opened, saves and names each one, and the `openThreads` method opens a sheet of recent chats where a row opens one and a swipe deletes it. `threads.endpoints` names an app's own endpoints of the same shape.
- Attachments are not on mobile yet: the `basic` shell profile has no file or image picker.
- Native blocks get `methods.streamFetch`, a server call whose answer streams (the shell's `expo/fetch`, with the bearer session and the shell header), and `useScreenFooter` from `@lowdefy/client-native` draws a block's own chrome in the page footer. A Screen with no footer slot now leaves the footer alone.
