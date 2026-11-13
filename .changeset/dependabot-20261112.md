---
'@lowdefy/ai-utils': patch
---

fix(deps): Update glob to 14 so agent file tools refuse patterns that exhaust the server

An agent with `fileSystem` access passes the model's glob pattern to `glob`. glob 13 used
minimatch 10, where a pattern of about 200 characters such as `x/**/../a/**/../a/…/b` takes
minutes and gigabytes of memory to expand (GHSA-g3hv-75wg-m249) and can crash the server. glob 14
uses minimatch 11, which refuses such a pattern straight away, so the tool call fails instead.
