---
'@lowdefy/blocks-native': minor
'@lowdefy/client-native': minor
'@lowdefy/shell': minor
---

feat(client-native): Screen `backgroundTint`

- `Screen` takes `backgroundTint: { color, colorDark, height }`: a vertical gradient from the colour at the top of the screen (35% in light mode, 45% in dark mode) easing out to clear at `height` of the screen height (default 0.15). It is drawn with react-native-svg as the page scroll view's first content, behind the blocks and fixed to the screen's top, so it shows behind the large title, through the translucent navigation bar and behind the content. `colorDark` is used in dark mode; a colour may be a CSS colour, a theme token or a palette hue. A change of tint cross-fades over 250ms.
- A pinned `headerBottom` draws the tint in its surface too, where the page draws it, so the strip continues the gradient rather than painting a band of the grouped background over it.
- The shell makes the iOS navigation bar clear over a Screen with a `backgroundTint` (`headerTransparent`; before iOS 26 also clear at the scroll edge, with the chrome material once content scrolls under it), so the tint shows behind it.
