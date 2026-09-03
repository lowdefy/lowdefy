---
'@lowdefy/blocks-antd': patch
---

The Search block now shows a loading spinner while its search data is still loading, instead of incorrectly reporting "No results found." When documents arrive while the modal is open — for example a request that resolves after the user opens search — the index now rebuilds live and the current query re-runs, so results appear without closing and reopening the modal. A new `loading` cssKey styles the spinner container.
