---
'@lowdefy/blocks-antd': patch
---

fix(blocks-antd): A RatingSlider's `color` colours its track, handle and dots, in the hover and active states too. The slider drew them in the theme's primary colour whatever `color` was set to.
