---
'@lowdefy/blocks-antd': minor
---

feat: Expose antd 6.6 features on the display and typography blocks, and stop passing deprecated props to antd.

The display and typography blocks were audited against the antd 6.6.5 docs. New properties,
events and CSS keys are additive; existing property names and values keep working and are
translated to the antd 6 names where antd renamed them.

New features:

- `Alert`: `variant` (`outlined` or `filled`) and `closeIcon`. The `message`, `action` and
  `closeIcon` CSS keys now style the title, actions and close button.
- `Avatar`: `srcSet`, and `focus` as a `group.maxPopoverTrigger`. In group mode `onClick` fires
  for each avatar with `event.index`.
- `Badge`: `ribbon` (`text`, `color`, `placement`) renders a corner ribbon around the content,
  `title: false` removes the native tooltip, and the `paddingInline` theme token. The `indicator`
  CSS key now styles the count.
- `Calendar`: `showWeek`, and `header`, `item` and `itemContent` CSS keys.
- `Card`: `variant`, `loading`, an `actions` slot for the bar at the bottom of the card, and a
  `title` CSS key. The `cover`, `actions` and `extra` CSS keys now also take styles.
- `Carousel`: `autoplay: { dotDuration: true }` for a progress dot, `initialSlide` and
  `waitForAnimate`. `onSwipe` passes `event.direction`.
- `Collapse`: `ghost`, `size` (`small`, `medium`, `large`), `collapsible` (`header`, `icon`,
  `disabled`), a list `activeKey`, a `title` CSS key and the `headerPaddingSM`, `headerPaddingLG`,
  `contentPaddingSM` and `contentPaddingLG` theme tokens.
- `Descriptions`: `size: medium`, item `span: filled` and breakpoint spans, `xxl` and `xxxl`
  columns, and `header` and `title` CSS keys.
- `Divider`: `variant` (`solid`, `dashed`, `dotted`), `size` (`small`, `medium`, `large`), and
  `title` and `rail` CSS keys.
- `Title` and `Paragraph`: `actions.placement` to put the copy and expand buttons before the text,
  `keyboard`, ellipsis `expandable: collapsible`, `defaultExpanded`, `symbol` and `tooltip`, and an
  `actions` CSS key. `onExpand` passes `event.expanded`.
- `Progress`: `size`, `percentPosition`, gradient and per-step `strokeColor`, circle `steps` with a
  `gap`, `butt` line caps, and `rail`, `track` and `indicator` CSS keys.
- `QRCode`: `iconSize` as `{ width, height }` and a `cover` CSS key.
- `Result`: `title` and `subTitle` CSS keys.
- `Statistic`: `timer` (`countdown` or `countup`, with a `format`) and an `onFinish` event, and
  `title`, `content`, `prefix` and `suffix` CSS keys.
- `Tag`: `variant` (`filled`, `solid`, `outlined`), `disabled`, `href`, `target`, `closeIcon` and
  a `closeIcon` CSS key.
- `TimelineList`: `orientation`, `variant`, `titleSpan`, a `label` CSS key and the `dotSize` theme
  token.
- `Watermark`: `text` lines can be `{ text, font }` to style each line.

Fixes:

- `Title` and `Paragraph` with an expandable ellipsis, an ellipsis suffix or a copy button cut plain
  text content to the given rows instead of collapsing it to "...".
- `Calendar` in year mode with `dateCellData` no longer repeats the month name in each cell.
- `Carousel` `onSwipe` fires. react-slick drops an `onSwipe` prop, so the event never ran.
- `Collapse` renders when `panels` is an empty list, and the `content` CSS key styles the panel
  body.
- `Avatar` group `onClick` fires. It was set on the group, which antd does not forward.
- Deprecated antd props are no longer passed: `Alert` `message`, `closeText`, `onClose` and
  `afterClose`; `Avatar.Group` `maxCount`, `maxStyle` and popover props; `size: default` on
  `Avatar`, `Badge`, `Card` and `Descriptions`; `Carousel` `dotPosition`; `Collapse.Panel` and
  `Descriptions.Item` children; `Progress` `width`, `trailColor`, `gapPosition` and line
  `strokeWidth`; `Timeline.Item` children, `pending`, `pendingDot` and `mode: left|right`.
- `Progress` `gapPosition` is applied. It was documented but not passed to antd.
- Examples in `tests.yaml` use `slots` instead of the deprecated `areas`, and no longer use
  properties the blocks do not have.
