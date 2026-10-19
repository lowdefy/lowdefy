---
'@lowdefy/client-native': minor
'@lowdefy/blocks-native': minor
'@lowdefy/build': minor
---

feat(client-native): A Screen headerBackdrop slot, and options reported before first paint

- A Screen's `headerBackdrop` slot draws blocks above the top of the content, behind the large title and the translucent bar, such as an Illustration beside the title. They scroll away with the title, take no room in the content and never take touches. The backdrop is lifted by a transform, so the scroll view's content keeps its layout.
- A Screen reports its header options in a layout effect, so the router enables a large title in the same update as the page's first content and the page opens with its large title expanded.
- `useScreenFocused` tells a block whether its screen is the one shown.
- An Illustration stops its animations while its screen is hidden, and draws each still layer only over the part of the drawing it covers, so a drawing split into many layers holds small backing stores.
