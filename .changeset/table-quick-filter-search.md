---
'@lowdefy/blocks-table': minor
---

feat(blocks-table): A Table quick filter over a long option list has a search box

A quick filter chip on a column with `options` opened a plain checkbox list, so finding one name in a long list, such as an owner column listing every member of an organisation, meant scrolling. A list of more than 8 options now has a search box at its top that narrows the options by label as you type, case-insensitive. Ticked options stay listed while you search, Escape clears the search, and a list of 8 or fewer is unchanged.
