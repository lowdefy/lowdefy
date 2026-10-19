---
'@lowdefy/blocks-antd': patch
---

fix(blocks-antd): Accept numeric title margins and avatar sizes.

- The `titleMarginTop` and `titleMarginBottom` theme tokens of Title, TitleInput, Paragraph and
  ParagraphInput accept a number of pixels as well as a CSS length, as antd does.
- The `size` of the avatars in an Avatar group, and of the profile avatar on Header,
  PageHeaderMenu, PageSidebarLayout and PageSiderMenu, accepts a pixel number as well as
  `default`, `small` or `large`.
