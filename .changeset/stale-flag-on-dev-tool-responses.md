---
'@lowdefy/server-dev': minor
---

Mark every dev docs response stale while the last build failed.

When a rebuild fails the dev server keeps serving the previous successful build, so `/lowdefy-docs` routes and the dev MCP tools could keep answering from a build that predates your latest edits. While `build/buildStatus.json` reports `error`, every response now says so: MCP tool results start with a `STALE: ...` text item, JSON responses carry `stale`, `staleSince` and `staleReason`, markdown responses get a `> STALE: ...` banner, and every `/lowdefy-docs` response carries `X-Lowdefy-Stale` and `X-Lowdefy-Stale-Since` headers. Nothing is refused — the flag informs, it does not gate — and it clears as soon as a build succeeds.
