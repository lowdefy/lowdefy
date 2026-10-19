---
'lowdefy': minor
---

feat: `.mcp.json` pins the version of the CLI running agent-setup

- `lowdefy agent-setup` writes `npx lowdefy@<version> mcp` with the version of the CLI that runs it, no longer the version installed in the app's `node_modules`. Every app in a repository now writes the same entry.
- agent-setup no longer renames a `lowdefy-docs` server in `.mcp.json`. It adds the `lowdefy` server beside it and leaves the old entry as it is.
- When `lowdefy mcp` and the dev server run different versions, the note on tool results gives the pinned fix, `npx lowdefy@<dev server version> agent-setup`, and asks the agent to pass it to the developer rather than run it.
