---
'@lowdefy/block-utils': minor
'@lowdefy/build': minor
'@lowdefy/errors': minor
'@lowdefy/blocks-antd': minor
'@lowdefy/blocks-antd-x': minor
'@lowdefy/blocks-basic': minor
'@lowdefy/blocks-files': minor
'@lowdefy/blocks-aggrid': minor
'@lowdefy/server-dev': patch
'@lowdefy/docs': patch
---

feat(build): Check `_event` paths against the block's declared event payload.

A block's `meta.events` entry now accepts `{ description, payload }`, where `payload` is a JSON
Schema for the object the block passes as `methods.triggerEvent({ name, event })`. When a block
declares a payload for an event, every `_event` path in that event's actions (`try`, `catch`,
`messages` and control branches) is checked against it at build. A path the payload has no room for
is a build error with the payload keys and a suggestion:

```
_event "valu" in event "onChange" on block "email" (TextInput) is not in the event payload. Payload: value. Did you mean "value"?
```

`_event: true`, integer keys and operator-supplied keys are never judged, a path below a property
with no declared shape is accepted, and an event with no declared payload is never checked - custom
blocks that document their events as strings keep working unchanged. New check slug `event-payload`
for `~ignoreBuildChecks`.

The legacy `{ description, event: { key: 'description' } }` form stays accepted and is read as a
payload with description-only properties. `plugins/blockSchemas.json` now carries a real string in
every event `description` (the object form used to be written into the JSON Schema whole), and
`plugins/blockMetas.json` and the extracted block types carry `events` as a name to `{ payload }`
map, so the dev server's `/lowdefy-docs/schema/blocks/{type}` route and `lowdefy_get_schema` return
each event's payload under `meta.events`.

The core block plugins now declare payloads with real types: every `event:` map in `blocks-antd`
(74 events), `blocks-files` (16) and `blocks-aggrid` (72) was migrated, and payloads were authored
for `ControlledList.onAdd`/`onRemove`, `Paragraph.onTextSelection`, `Html.onTextSelection`,
`Box.onPaste` (now passes `{ text }`), `MultipleSelector.onChange` (now passes `{ value }`),
`Upload`/`UploadDragger`/`UploadPhoto.onChange` (now always pass `{ file, fileList }`) and
`AgentChat.onConversationStart`/`onFeedback`/`onDataPart`/`onLinkClick`. The docs gallery Events
table prints each payload as `{ key: type, … }`.
