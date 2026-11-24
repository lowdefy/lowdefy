---
'@lowdefy/nunjucks': patch
'@lowdefy/docs': patch
---

fix(nunjucks): The date filter formats every moment.js token again

When the `_nunjucks` date filter moved from moment.js to Day.js, tokens that Day.js does not know were printed as text, with no error or warning. `{{ date | date('lll') }}` rendered `lll`, `date('Do MMM YYYY')` rendered `28o Aug 2026` instead of `28th Aug 2026`, and quarter, week, day-of-year and localized formats such as `L`, `LL`, `LT` and `LTS` came out the same way. Templates written for Lowdefy 4 rendered the wrong text without anyone noticing.

The date filter now formats every token in moment.js's format list the way moment.js did, including `Do`, `Q`, `w`, `W`, `DDD`, `E`, `gggg` and the localized formats. An invalid date renders as `Invalid date` again, as it did with moment.js, instead of `Invalid Date`.
