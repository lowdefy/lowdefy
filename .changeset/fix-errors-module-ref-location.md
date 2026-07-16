---
'@lowdefy/errors': patch
---

fix(errors): Resolve config locations through module refs to the defining file.

Blocks passed into a module via vars resolved their config location to lowdefy.yaml instead of the file where they are written, because a module invocation's ref has no file path of its own. Location resolution now walks the ref chain to the nearest real file, so Cmd/Ctrl+click open-in-editor, `/lowdefy-docs/find`, and error messages point at the correct yaml file and line for module content.
