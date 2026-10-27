---
'@lowdefy/blocks-native': minor
'@lowdefy/build': minor
'@lowdefy/shell': minor
---

feat(blocks-native): Box swipe events and a PageDots block

- `Box` takes `onSwipeLeft` and `onSwipeRight` on mobile. Its PanResponder takes only clear horizontal swipes (across more than 40pt and more than twice as far across as down, or a fast flick) in a direction the Box has an event for, so vertical scrolls go on, and leaves drags that start within 20pt of the screen's left edge to the iOS back gesture. `swipeFeedback: true` moves the Box a little with the drag on a rubber band and springs it back. Screen readers get the swipes as accessibility actions.
- `PageDots` is a mobile-only display block, iOS's page control: `count` dots in `color` with the `index` dot in full colour, which slides to its place on a spring when the index changes. For a record's place among recents.
