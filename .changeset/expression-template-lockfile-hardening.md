---
'@lowdefy/operators': patch
'@lowdefy/build': patch
'@lowdefy/helpers': patch
'@lowdefy/nunjucks': patch
'@lowdefy/blocks-basic': patch
'lowdefy': patch
'@lowdefy/docs': patch
---

fix: `${ }` recognition, `Template` scoping, and module lockfile safety

`${ … }` expressions are now recognised only when the whole scalar is a single expression, the `${` first and its matching `}` last, so strings such as `"${HOME}/data"` and `"${a} ${b}"` remain the literals they always were and no existing config breaks. Expressions inside `_js.args` and `_nunjucks.on` now compile (only the `_js` body and the `_nunjucks` template are exempt), a negative index such as `state.a[-1]` is rejected instead of silently producing an undefined path, and expression positions survive `serializer.copy`, so errors in expressions inside components still point at the source.

The `Template` block scopes its `css` with an attribute selector, so styling works for templates inside a `List`; `css` with unbalanced braces is rejected instead of escaping the block's scope; slotted blocks keep their state when the template or its context changes; and a slot configured with no matching `{% slot %}` warns in the console. The `Html` block is deprecated in favour of `Template`.

`lowdefy modules update` refuses a malformed or merge-conflicted `lowdefy-modules.lock.yaml` instead of silently rewriting it empty and wiping every pin, a lock entry whose `commit` is not a 40-character sha is rejected, the unused `fetchedAt` field is gone, and a production build with an unpinnable branch ref fails immediately rather than after fetching from GitHub.
