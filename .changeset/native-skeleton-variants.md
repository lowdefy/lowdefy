---
'@lowdefy/client-native': minor
'@lowdefy/blocks-native': minor
---

feat(blocks-native): Skeleton variants with a synced shimmer, content fade-in and ActivityTimeline link chips

- `Skeleton` takes `variant`: `listRow`, `insetGroup`, `hero`, `paragraph`, `card` and `timeline`, each shaped like the content it stands for, with `trailing`, `header`, `lines`, and `count` as a list of section rows for `insetGroup`. `count`, `rows` and `avatar` still draw list rows.
- The shimmer is a soft wide band that sweeps every skeleton on screen together from one 1.2s clock, in the new `colorSkeleton` and `colorSkeletonHighlight` tokens, and a static fill with Reduce Motion on. A skeleton is one "Loading" progress bar to a screen reader.
- A block with `loading` and a `skeleton` fades its content in over 200ms when it stops loading. client-native exports `useReduceMotion`.
- `ActivityTimeline` takes `linkChips`, as the Markdown block's, for links in comment bodies.
