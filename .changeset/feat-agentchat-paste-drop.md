---
'@lowdefy/blocks-antd-x': patch
---

feat(blocks-antd-x): AgentChat attachments accept clipboard paste and drag-and-drop.

With `sender.attachments.enabled`, files could only be attached through the paperclip's
native picker — a pasted screenshot or a file dragged onto the composer went nowhere.
The composer now takes files from all three routes through one intake: the `accept` list
and `maxSize` cap apply to each, and pasted clipboard images (which every browser names
`image.png`) get a unique `pasted-<timestamp>` name so two pastes don't collide in the
attached list. A dashed outline marks the composer while a file drag is over it.
