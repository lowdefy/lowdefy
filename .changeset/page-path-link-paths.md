---
'@lowdefy/build': minor
'@lowdefy/api': minor
---

feat: Pages carry the paths of the pages they link to, and static links to pages with placeholders are checked

- Each page artifact carries `linkPaths`, `{ [pageId]: path }` for every page that declares a `path` and that the page's collected links target: Link actions with a static `pageId`, HTML `data-page-id` links and Dynamic block link policies. It is `{}` when there are none.
- A Link action with a static `pageId`, or an HTML `data-page-id` link, to a page with placeholders must give every placeholder a value, in `pathParams` or `data-path-params` (a JSON object). Values an operator computes are checked at runtime.
- `MenuLink` takes `pathParams`. A menu link to a page with placeholders must give every placeholder a static value, and the default menu leaves such pages out. When `homePageId` is unset, the root config's `home` carries the chosen menu link's `pathParams`.
- A module auth page is contributed at its `path` when it declares one, and auth page URLs are mapped to pages through the route table.
