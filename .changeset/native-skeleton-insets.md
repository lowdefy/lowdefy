---
'@lowdefy/blocks-native': patch
'@lowdefy/client-native': patch
---

fix: A loading block's skeleton takes its element style on mobile, and the hero and timeline Skeletons are inset 16pt

- A block's `skeleton` style is split into slots as a block's style is, so `skeleton: { type: Skeleton, style: { .element: { paddingHorizontal: 16 } } }` pads the Skeleton as the same style on a Skeleton block does, and plain CSS places the skeleton. Before, the skeleton's block got no styles and its element style was lost, so hero and timeline bars touched the screen edge.
- The `hero` and `timeline` Skeleton variants are inset 16pt from the screen edges by default, as `insetGroup` and `card` are. The element style's `paddingHorizontal` replaces the inset (0 draws them edge to edge).
