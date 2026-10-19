---
'@lowdefy/blocks-native': patch
---

fix: A native Sheet or Selector picker sheet closes when its screen stops being shown

An open `Sheet` or `variant: sheet` Selector closes when its screen is no longer the one shown, such as after a tab switch or a navigation. A sheet is drawn above the whole app, so before it stayed over the next screen.
