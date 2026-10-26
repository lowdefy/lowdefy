---
'@lowdefy/ajv': patch
'@lowdefy/build': patch
---

fix: A `_ref` that returns a list of actions, placed as one item of an event's action list, no longer crashes the build with `LowdefyInternalError: Cannot read properties of undefined (reading 'keyword')`

- `@lowdefy/ajv` keeps at most 20 errors per validation and lets the error count run ahead of them. A schema branch that passed after the cap reset the errors to its starting count, which grew the array with holes, and ajv-errors read a hole as an error. The reset now only shrinks the array, and ajv-errors' property message path is set only on a message that was kept. Any config with enough schema errors could hit this; several nested action lists in one block's events did.
- The build now names the mistake with its location: `Action list on event "onClick" on block "save" on page "home" holds a list at item 1, which is a list of actions, not an action.` Action lists are not flattened, since the engine runs each item as an action. Use the `_ref` as the whole list, or join lists with `_build.array.concat`.
