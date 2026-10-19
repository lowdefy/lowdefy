---
'@lowdefy/blocks-antd': patch
---

fix(blocks-antd): Pagination wraps on a narrow row, SegmentedSelector selects nothing for an unmatched value, Sider ignores null widths

- **Pagination**: antd 6 lays the pagination out as one flex row that does not wrap. When the total text, page buttons and size changer were wider than their container, the total text collapsed to one word per line and the rest overflowed to the right. The row now wraps onto a second line and the total text stays on one line.
- **SegmentedSelector**: a value that matches none of the options (or an empty value) no longer draws the first option as selected. antd's `Segmented` fell back to its first option when it received no value, and clicking that option then fired no `onChange`. Now no option is selected and every option can be picked.
- **Sider** (and `PageSidebarLayout`, `PageSiderMenu`): a `null` `collapsedWidth`, `width` or `breakpoint`, as an unset property of a module var gives, now leaves antd's default in place. Before, the sider wrote a width of `"null"`, so it kept its expanded width when collapsed, or had no width at all when the page loaded collapsed.
