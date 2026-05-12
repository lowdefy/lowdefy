---
'@lowdefy/blocks-antd': patch
---

fix(blocks-antd): Correct nested `links` placement in Menu meta schemas.

The Menu and MobileMenu meta schemas declared the third-level `links` array inside the user-facing `properties` field instead of as a sibling of it. The schema shape now matches the runtime, so block-property validation and editor autocomplete report the correct structure for three-level menu configs.
