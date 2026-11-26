---
'@lowdefy/engine': patch
---

perf(engine): Copy a page's block config once, not once per nested container

The engine deep-copied a container's slot config every time it built the slots under it, so a page copied each block's config once for every container above it, and again for every list row.

- Each page context, and the app context, now copies its config once, when it is created. Nested containers and list rows read that copy and build their own slot objects to hold their blocks, so no block writes into config another block reads.
- Page instances of one page still each copy the config they were fetched with.
- Rows of a list now share their blocks' config, so an operator tree compiled for one row serves every row.
