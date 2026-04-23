---
'@lowdefy/blocks-aggrid': patch
---

fix(blocks-aggrid): React to `loading` prop changes on AgGrid.

The `loading` block flag now toggles AG Grid's native `showLoadingOverlay` / `hideOverlay` at runtime. Previously the overlay calls were inside a `useEffect` with an empty dependency array, so they only ran once on mount and never reacted to subsequent `loading` changes. The effect has been split in two — method registration still runs once, overlay toggling now runs whenever `loading` changes — and an `onGridReady` callback applies the initial overlay state safely after the grid api is attached.
