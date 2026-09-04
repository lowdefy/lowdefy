---
name: lowdefy-notifications
description: Use when giving the user feedback after an action — `DisplayMessage`, `Notification`, `Message` blocks, action `messages`, and when a `Result` block is the better choice.
kind: reference
lowdefyVersion: 5.5.1
---

# User notifications

<!-- generated:reference:start -->
## Reference

What this skill covers, and the call that returns the live version from the running dev server. Read these before writing config - never write a type name or property from memory.

### Docs

`lowdefy_get_doc` by slug (or `GET /lowdefy-docs/content/{slug}`): `display-blocks/message`, `display-blocks/notification`, `actions/displaymessage`.

### Blocks

`lowdefy_get_schema` with kind `blocks`, then `lowdefy_get_examples` for usage yaml: `Message` (`@lowdefy/blocks-antd`), `Notification` (`@lowdefy/blocks-antd`), `Result` (`@lowdefy/blocks-antd`).

### Actions

`lowdefy_get_schema` with kind `actions`: `DisplayMessage` (`@lowdefy/actions-core`).
<!-- generated:reference:end -->

## Recipe

Must cover: `DisplayMessage` after a successful `Request`, action `messages: { loading, success, error }`, `Notification` via `CallMethod` for persistent alerts, `Result` for terminal states, and never notifying on `onInit`.
