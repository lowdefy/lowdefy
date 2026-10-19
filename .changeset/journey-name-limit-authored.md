---
'lowdefy': patch
---

fix(cli): The journey name limit applies to the name as authored, not to each `[user]` run

A journey whose `user` is a list runs once per user, named `<name> [<user>]`. The 100-character limit was checked against that expanded name, so a name that passed for `[owner]` failed for `[control_owner]` with `Journey "name" should be at most 100 characters`, while `lowdefy test --lint` reported nothing. The authored name is now the one checked, in lint and when running, and the expanded run name is never checked again.
