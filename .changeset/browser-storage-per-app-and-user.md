---
'@lowdefy/helpers': patch
'@lowdefy/client': patch
'@lowdefy/engine': patch
'@lowdefy/actions-core': patch
'@lowdefy/blocks-antd': patch
'@lowdefy/blocks-table': patch
'@lowdefy/operators-js': patch
'@lowdefy/server': patch
'@lowdefy/server-dev': patch
'@lowdefy/server-e2e': patch
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

fix(client): Keep browser storage per app and clear user data at sign-out

Every key Lowdefy writes to the browser's local storage now names the app it belongs to (its `slug` and base path), so apps served from one origin no longer read or overwrite each other's values. The dark mode, locale and sider open preferences are kept per app and stay across sign-outs; a preference stored before this change is moved to the app's key the first time it is read.

Data that belongs to a person is also kept per signed-in user: the `Search` block's recent searches and the `Table` block's persisted view (`persist.storage: local`). It is cleared when the user signs out with `Logout`, and on page load when a different user, or nobody, is signed in on the browser. The scroll positions Lowdefy keeps in session storage are cleared at the same time.

`SetLocalStorage`, `GetLocalStorage` and `RemoveLocalStorage` keep their keys per app too. A value stored under the bare key before this change is moved to the app's key the first time `GetLocalStorage` reads it. Values set with these actions stay after sign-out, so they should still not hold secrets or personal data.

Blocks reach the keys through two new block methods, `methods.getAppStorageKey(name)` and `methods.getUserStorageKey(name)`, and actions through `methods.getAppStorageKey(name)`.
