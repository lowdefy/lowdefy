---
'lowdefy': patch
---

feat(cli): Journey lint warns on a switch to the person already acting, and the docs show how to check what a second person sees

A journey on a data set can already act as one user and then, with `as: <another data set user>`, check in the same run and the same database what a second user sees (an overridden decision that lands in its owner's inbox, an assigned task, a mention). This was easy to miss, so the config tests guide now walks through it with the notification example, and the journey agent skills suggest it whenever a change is felt by someone else. `lowdefy test --lint` has a new rule, L7, that warns on an `as` step that names the person who is already acting (`as: main` while still the main user, or the same name twice running), since it switches to nobody.
