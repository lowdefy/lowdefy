---
'@lowdefy/server-dev': patch
'lowdefy': patch
---

fix(server-dev): Editing a block in a local plugin no longer restarts the dev server

A local plugin with any server-side type (a connection, request, server operator, auth or agent type) restarted the dev server on every change to any of its files, blocks included. The restart drops page loads, screenshots and tool calls in flight until the new server answers, although Vite hot-replaces block code by itself. The dev server now restarts only when a changed file is one the server imports: it follows the imports of the build's server-side plugin import files through the local plugins' files, resolving package `exports` and `#` subpath `imports` the way the server does. This also restarts the server for code it imports that did not restart it before: a plugin that only holds steps, or a helper a connection imports from another local plugin. A changed `package.json` of a plugin the server imports from restarts it, and where the dev server cannot be sure (an import it cannot resolve, a dynamic import of a computed path), any change to that plugin restarts it as before. Every change still rebuilds the config.
