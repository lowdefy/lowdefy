---
'@lowdefy/blocks-antd': patch
---

fix(blocks-antd): Default logo width switches at the same breakpoint as the logo image.

PageHeaderMenu and PageSiderMenu swapped the desktop/mobile logo image at 577px but the default width classes switched at 640px, so between those widths the desktop wordmark rendered squeezed into the mobile slot.
