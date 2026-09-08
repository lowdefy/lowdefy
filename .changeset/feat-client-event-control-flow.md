---
'@lowdefy/build': minor
'@lowdefy/engine': minor
---

feat: Add `:if`, `:switch` and `:return` controls to client event action lists.

Event action lists now support routine-style control flow, using the same grammar as API routines:

- `:if` / `:then` / `:else` gates a group of actions on a single condition, instead of repeating the same `skip` expression on every action.
- `:switch` runs the `:then` list of the first truthy `:case`; later cases are never evaluated, and an optional `:default` runs when no case matches.
- `:return` ends the whole event successfully — replacing the early-`Throw` workaround — without running the event's `catch` actions.

Controls can nest and work in both `try` and `catch` lists. Actions not executed for a control-flow reason (untaken branches, unmatched cases, actions after a `:return`) are reported as skipped, so `_actions` lookups and action indices are unchanged for existing configs. The build validates control shape and enforces action id uniqueness across all branches.

Note: an event action carrying a stray `:if`, `:switch` or `:return` key (previously a schema warning at build and ignored at runtime) is now treated as a control and fails the build with a clear error.
