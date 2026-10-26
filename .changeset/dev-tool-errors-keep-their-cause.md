---
'@lowdefy/build': patch
'@lowdefy/cli': patch
'@lowdefy/errors': patch
'@lowdefy/server-dev': patch
---

fix(build, cli, errors, server-dev): Dev tools and build errors keep their cause and location

`@lowdefy/errors` exports `isExpectedError`, the one test for an expected outcome (a `UserError` or an auth refusal) versus a fault. The dev server's agent error feed uses it, so an auth refusal is no longer reported to an agent as an app error.

When the server explains a browser error with a plugin schema error ("property title must be type string"), the agent feed records that error instead of the original "Error rendering block". Feed entries from the browser and the server carry the same fields, including `hint` and `configKey`.

A dev tool (an MCP tool, a journey run, `run_endpoint`, the mutants route) that fails with an error of its own is logged with its stack, and the agent is told the tool failed rather than its app. Bad tool arguments are answered as `UserError`s. The MCP tool-call debug line names the argument keys, not their values, and `run_endpoint` logs the caller's id instead of the whole user object.

A plugin that fails to import gives its reason (a syntax error, a missing dependency) in the build error, and the build status keeps the cause and stack of an internal fault. Module entry and module var errors point at their line in `lowdefy.yaml`, and an invalid `config` or `theme` is a located `ConfigError`. The dev server's warnings are no longer printed as `ERROR` lines, and a crash in the dev server is printed whole rather than in fragments. A build artifact that is there but unreadable is reported instead of read as empty, and an `_js` map that fails to load is logged.

The CLI's error telemetry sends the error name, a message cut to 300 characters and the stack frames, with the home directory replaced by `~`.
