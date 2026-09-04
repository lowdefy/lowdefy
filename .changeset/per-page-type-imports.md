---
'@lowdefy/build': minor
'@lowdefy/client': minor
'@lowdefy/server': minor
'@lowdefy/docs': patch
---

feat: production builds code-split block, action and operator packages per page

The build writes a type-import module per page listing exactly the blocks, actions and client operators that page uses, and the client loads a page's module as it navigates, so the bundler ships the types a page needs instead of every type the app uses in the main chunk; types shared by many pages are hoisted into shared chunks and loaded once. The app-wide barrels are kept as a fallback and loaded on demand for a page that carries a type its module does not list, such as a `Dynamic` block resolved when the page is fetched. The development server is unchanged. Set `config.experimental.perPageImports: false` to turn the split off.
