---
'@lowdefy/blocks-basic': minor
'@lowdefy/nunjucks': minor
'@lowdefy/docs': patch
---

feat(blocks-basic): Add the `Template` block - Nunjucks markup with scoped CSS and block slots.

`Template` renders `properties.template` (Nunjucks source) with `properties.context`, replacing
HTML strings built in `_js`. `{{ value }}` is HTML-escaped by default and `{{ value | safe }}` opts
out; the result is sanitized with DOMPurify. `properties.css` is CSS text nested under the block's
wrapper selector, so rules apply to this block only. `{% slot "footer" %}` marks where the blocks
configured under `slots.footer` render, so real Lowdefy blocks (a Button, an input) sit inside the
templated markup and fire events as usual. Classes in the template are Tailwind-scanned.

`@lowdefy/nunjucks` gains `createTemplateFunction(templateString)`: an LRU-cached compiled template
in an autoescaped environment with the `{% slot %}` tag registered. The shared `nunjucksEnv` is
unchanged.
