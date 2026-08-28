---
'@lowdefy/build': minor
---

feat(build): `state-refs` check is now a warning, never a prod-build error.

The check that flags a `_state` reference whose top-level key has no matching input block on the
page (`checkSlug: state-refs`) previously warned in dev but **failed production builds**
(`prodError: true`). State can be created at runtime — a custom action calling `setState`, a
dynamic `SetState` wrapper — which the build cannot see statically, so the check is a heuristic and
a miss can be a false positive. Failing a production build on a false positive is worse than the
missed check, so it now **warns in both dev and prod** and never fails the build.

Suppress the warning for a known-good reference with `~ignoreBuildChecks: [state-refs]` on the
reference.
