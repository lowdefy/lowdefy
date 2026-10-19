---
'@lowdefy/blocks-antd': patch
---

fix(blocks-antd): DateRangeSelector applies a typed date on Enter

Typing a start or end date into a `DateRangeSelector` and pressing Enter now applies the range when the other date is set: `onChange` fires with the new range, the popup closes, and Escape no longer puts back the old date. Before, Enter only moved focus to the other date, and nothing applied until that date was confirmed too. Picking dates with the mouse is unchanged.
