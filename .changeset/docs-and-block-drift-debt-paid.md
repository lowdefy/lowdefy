---
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
'@lowdefy/blocks-antd': patch
---

The last recorded mismatches between the documentation and the framework are fixed, so both drift gates now run with nothing on their allowlists. The `_media` example for `default` no longer shows a key the operator rejects, and the operator's `key` argument now lists the keys it accepts; the v4-to-v5 inline-style migration example shows the keys being migrated rather than a whole `Card` block that v5 would refuse; and the page for `Auth0LogoutCallback` is removed, as the callback, the `auth.callbacks` key and the `AUTH0_LOGOUT` callback URL all went with the v4 auth stack. The `Label` block drops unreachable responsive-column code that its schema never allowed, and the block property scan no longer mistakes a property read on a nested menu link for a property of the block itself.
