---
name: lowdefy-events
description: Use when wiring user interaction to behaviour — which event names a block fires, ordering actions, reading the event payload, async actions and error handling in an action chain.
kind: reference
lowdefyVersion: 5.5.1
---

# Events and actions

<!-- generated:reference:start -->
## Reference

What this skill covers, and the call that returns the live version from the running dev server. Read these before writing config - never write a type name or property from memory.

### Docs

`lowdefy_get_doc` by slug (or `GET /lowdefy-docs/content/{slug}`): `concepts/events-and-actions`, `operators/_event`, `operators/_actions`, `actions/setstate`.

### Operators

`lowdefy_get_schema` with kind `operators`: `_event` (`@lowdefy/operators-js`), `_actions` (`@lowdefy/operators-js`).

### Actions

`lowdefy_get_schema` with kind `actions`: `SetState` (`@lowdefy/actions-core`), `Request` (`@lowdefy/actions-core`), `Link` (`@lowdefy/actions-core`), `DisplayMessage` (`@lowdefy/actions-core`).
<!-- generated:reference:end -->

## Recipe

Must cover: event names are validated at build (an unknown event is an error), `onInit`/`onInitAsync`/`onMount` order, `_event` payload per event, `_actions` to read a previous action result, `try`/`catch` chains, `skip`, and `messages` on actions.
