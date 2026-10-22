---
'@lowdefy/blocks-antd': patch
---

fix(blocks-antd): DateRangeSelector applies a typed date on Enter

Typing a start or end date into a `DateRangeSelector` and pressing Enter now applies the range when the other date is set: `onChange` fires with the new range, and Escape no longer puts back the old date. Before, Enter only moved focus to the other date, and nothing applied until that date was confirmed too. A typed date the block disables is not applied, and a start date after the end date is swapped into order when both inputs are enabled, as when the range is picked. A partly typed or cleared date is not applied. A typed date also stays when the block renders again before it is applied, for example for its own `onBlur` actions; before, it went back to the value. Picking dates with the mouse is unchanged.
