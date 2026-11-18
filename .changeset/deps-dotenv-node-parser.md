---
'lowdefy': patch
'@lowdefy/server-dev': patch
'@lowdefy/node-utils': patch
---

chore(deps): Replace dotenv with Node's .env parser

The CLI and the dev server load the app's `.env` with Node's built-in parser (`util.parseEnv`, the parser `process.loadEnvFile` uses), through a new `loadDotEnvFile` helper in `@lowdefy/node-utils`. `dotenv` is no longer a dependency of `lowdefy` or `@lowdefy/server-dev`.

What stays the same: a missing `.env` is ignored; a variable already set in the shell is not overwritten (and the dev server still takes changed values when you edit `.env` while it runs); comments, quotes, `export`, multi-line values and `\n` escapes in double quotes parse as before; a line that is not a variable is skipped, not an error. A `.env` saved with a byte order mark (as some Windows editors do) still loads its first variable.

What changes:

- A `KEY: value` line (a colon instead of `=`) is skipped. dotenv read it as a variable; Node's parser does not. Use `KEY=value`.
- A `.env` that exists but cannot be read (no read permission, or a directory named `.env`) stops `lowdefy` with the read error. dotenv skipped it silently.

`process.loadEnvFile` itself is not used, because it cannot overwrite a variable the dev server loaded earlier, and it loses the first variable of a file that starts with a byte order mark.
