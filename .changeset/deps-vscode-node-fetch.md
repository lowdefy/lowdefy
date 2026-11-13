---
'lowdefy-vscode': patch
---

chore(deps): Use the global fetch in the VS Code extension

The extension calls the dev server with the global `fetch` and no longer depends on `node-fetch`. Its minimum VS Code version moves from 1.75 to 1.101, the first release whose extension host runs Node 22 (Electron 35); 1.100 and earlier run Node 20 or older. `@types/vscode` moves to 1.101.0 to match, and the TypeScript config lists the `node` and `mocha` types, which TypeScript 6 and later no longer load on their own.
