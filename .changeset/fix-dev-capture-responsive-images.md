---
'@lowdefy/server-dev': patch
---

fix(server-dev): Annotated screenshots render responsive images correctly.

Tab captures embedded each image's fallback `src` instead of the variant the browser was displaying, warping `<picture>`/`srcset` images — most visibly the header logo squashed into its mobile mark. Captures now pin every responsive image to the displayed variant and restore the page afterwards.
