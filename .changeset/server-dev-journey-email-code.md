---
'@lowdefy/server-dev': minor
---

A journey can type a one-time code from an email: `fill: { blockId, fromEmail: { to, subject, match } }` waits for the newest matching email, like the `email` step, and types the first match of the regular expression `match` (or its first capture group) into the block, without leaving the page. Sign-in by emailed code can now be tested end to end.
