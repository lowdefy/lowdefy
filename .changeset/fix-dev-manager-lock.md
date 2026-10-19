---
'@lowdefy/server-dev': patch
---

fix(server-dev): Refuse to start a second dev manager for the same app

Two dev managers on one app raced each other's incremental builds - both watched the
config and rewrote the same build directory, so one wedged on a half-deleted pages
directory (ENOTEMPTY) and kept serving a stale build with no error anywhere. The
manager now takes a pid lock in the server directory and a second instance refuses
loudly, naming the running pid; a lock whose pid is dead is taken over.
