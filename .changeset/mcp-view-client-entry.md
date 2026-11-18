---
'@lowdefy/client': minor
'@lowdefy/server': minor
'lowdefy': minor
---

feat: The web client runs a page as an MCP App view. The production server builds a second client entry, `client/view.jsx`, for an app whose `mcp` block has a view, and `/api/view/boot` names it to the view's loader. The entry takes its root config from `/api/view/root`, its user from `/api/user` and its page from `/api/page`, all on the app's origin with a bearer session it mints through the host; the auth client is not loaded in a view. `@lowdefy/client` gains `createViewHost`, a client host with the session token in memory only, in-memory stores and a `window.location` that is the view's address on the app's origin, and `createViewRouter`, a router that keeps its location itself. A 401 mints a new session and sends the call once more without reloading the page or losing its state; a second 401 shows the view's fallback. When the app is redeployed the view shows a button that loads the new build, and when the app answers as another caller the view fetches the user and page again. The view's frame is never reloaded. `Client` takes its host as a prop; without one it builds the browser host as before. For an app with a view, the page HTML now links the stylesheets of the chunks its entry shares with the view entry.
