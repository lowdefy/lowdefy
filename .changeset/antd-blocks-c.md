---
'@lowdefy/blocks-antd': minor
---

feat: Expose antd 6.6 dropdown, tree and label features on the selector blocks and fix their antd deprecations.

The selector, tree, list and Label blocks were audited against antd 6.6.5. New properties, events
and style keys are additive; existing properties keep their names and defaults.

**Selector, MultipleSelector, TreeSelector, TreeMultipleSelector**

- New properties `placement`, `listHeight`, `virtual`, `popupMatchSelectWidth`, `prefix` and
  `prefixIcon`.
- New `onOpenChange` event with `{ open }`.
- New `popup` and `prefixIcon` style keys. TreeSelector and TreeMultipleSelector also get the
  `selector` key that the other two already had.
- While the block is loading, the suffix icon becomes a spinner.
- Selector and MultipleSelector accept `variant: underlined`.

**MultipleSelector**

- New `maxCount`, `showSearch` and `removeIcon` properties (plus a `removeIcon` style key).
  `maxTagCount` also accepts `responsive`.
- `onChange` now passes `{ value }`, as Selector does.

**TreeSelector and TreeMultipleSelector**

- New `treeLine` and `treeExpandAction` properties.
- `theme` now also applies the selector tokens (`selectorBg`, `hoverBorderColor`,
  `activeBorderColor`, the `multipleItem*` tokens and so on). They were documented but had no
  effect, because antd styles the TreeSelect input with the Select tokens. New tree node tokens:
  `indentSize`, `nodeHoverColor`, `nodeSelectedColor` and `switcherSize`.
- TreeMultipleSelector gets `maxCount`, `checkStrictly` (with `checkable`),
  `autoClearSearchValue` and `removeIcon`. `maxTagCount` also accepts `responsive`.

**TreeInput**

- New `blockNode` and `height` properties. Setting `height` turns on virtual scrolling for large
  trees.
- New `item`, `itemTitle` and `itemSwitcher` style keys.
- `theme` now documents the Tree tokens instead of the TreeSelect ones.

**RadioSelector, CheckboxSelector, ButtonSelector, SegmentedSelector**

- New `options` style key for styling each option.
- ButtonSelector gets `block`, which stretches the buttons to full width, and `direction`, which
  can stack them vertically.
- SegmentedSelector options accept a `tooltip`, and `icon` can be an Icon properties object.

**Label**

- New `wrap` property (also on every input's `label`), for wrapping long inline labels.
- Fixed: the Label block's `theme` tokens (`labelColor`, `labelFontSize`,
  `labelRequiredMarkColor`, colon margins, feedback colors) had no effect and now apply.
- Fixed: `class.element` and `style.element` now reach the Label block's row.

**Fixes**

- RadioSelector and CheckboxSelector no longer trigger antd's deprecated `Space` `direction` prop.
- ListSelector no longer passes the deprecated Card `size="default"`.
- Selector and MultipleSelector build antd `options` instead of the deprecated `Select.Option`
  children. The search props (`filterOption`, `onSearch`, `autoClearSearchValue`,
  `treeNodeFilterProp`) now go inside `showSearch`, where antd 6 expects them.
- ControlledList: the `addItemButton.title` lookup had a stray trailing space in its path. Items
  added for `minItems` are now pushed after render instead of during it. The remove icon no longer
  causes a React key warning.
- Tree dropdown nodes no longer log antd's "`key` or `value` must be the same" warning.
- The Selector and TreeSelector e2e helpers `value` and `placeholder` read antd 6's class names.
- TreeInput examples use the flat `primaryKey`/`parentKey` data model instead of nested
  `children`, which TreeInput does not read.
