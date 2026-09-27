---
'@lowdefy/engine': patch
---

fix(engine): a `class` operator that returns a map of CSS keys is reported instead of applied as literal class names.

An operator in `class` sets the classes of the CSS key it sits under, the block itself at the root.
When it returned a map of CSS keys (`{ .element: p-4 }`), the keys were applied as class names such
as `.element`. Those keys are now left out and reported as a config error with the block's config
location.
