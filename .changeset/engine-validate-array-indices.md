---
'@lowdefy/engine': patch
'@lowdefy/docs': patch
---

fix(engine): Resolve `$` row indices in Validate and ResetValidation blockIds

`Validate` and `ResetValidation` matched blockIds literally, so `params: list.$.name` in a list row matched nothing and the validation passed without checking the row. The blockIds are now resolved from the action's array indices, the same way `SetState` and `CallMethod` resolve them, so `list.$.name` validates the `name` input in the row where the action ran. `regex` patterns are not changed, because `$` already means end of string there. The docs also now name the object param `blockIds`, which is the key the actions read. Fixes #927.
