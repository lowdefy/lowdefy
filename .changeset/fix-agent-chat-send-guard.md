---
'@lowdefy/blocks-antd-x': patch
---

fix(blocks-antd-x): AgentChat refuses a second send while the first is still in `onBeforeSend`.

The composer was only locked while `useChat` reported streaming, and a send begins with an await on `onBeforeSend`, the seam apps use for a quota or entitlement request. For as long as that took, every further submit ran the send again: one slow check, N identical messages, N agent requests the moment the checks resolved. The block now holds a pending-send flag from the start of `handleSend` to its end, drops re-entries, and shows the Sender's loading state for the whole of it.
