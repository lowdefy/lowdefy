---
'@lowdefy/helpers': patch
'@lowdefy/operators-js': patch
---

fix(deps): Update intl-messageformat to 12.1.5

Version 12's only breaking change is for TypeScript users. The update brings ICU message parser fixes that change output in two rare cases: date skeletons with four `e` or `c` letters (`::eeee`, `::cccc`) now give the full weekday name ("Wednesday") as the ICU spec says, instead of the short one ("Wed"), and compound unit skeletons such as `::unit/kilometer-per-hour` now format ("50 km/h") instead of throwing. Plain arguments, plurals, select, number and date styles format as before.
