---
'@lowdefy/blocks-native': minor
'@lowdefy/build': minor
'@lowdefy/shell': minor
---

feat(blocks-native): Add an Illustration block, an animated vector drawing

- `Illustration` draws SVG markup with keyframe animations of its elements by id: `translateX`, `translateY`, `rotate`, `scale`, `scaleX`, `scaleY` and `opacity`, with `duration`, `delay`, `loop`, `origin` and an easing per animation or keyframe (`linear`, `ease`, `easeIn`, `easeOut`, `easeInOut`, or `step` for frames that swap, as pixel art does). Each animated element is drawn in a view of its own, so the animations run on React Native's native driver. It adds no native module.
- Colours are `var(--name)` references to `colors`, with `colorsDark` over them in dark mode; theme tokens work too (`var(--colorLabel)`).
- `position` (`{ top, right, bottom, left }`) draws the box at those offsets from the block's place without taking room, such as a Screen's first block reaching up beside the large title, where it scrolls away with the title. It never takes touches, holds still with Reduce Motion on, and is hidden from screen readers unless it has a `title`.
