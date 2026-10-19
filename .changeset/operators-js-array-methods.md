---
'@lowdefy/operators-js': minor
'@lowdefy/docs': patch
---

feat(operators-js): Add push, unshift, pop, shift, at, findLast, findLastIndex, flatMap and from to `_array`

`_array` gains the array methods that were missing:

- `_array.push` and `_array.unshift` add items to the end or start of an array.
- `_array.pop` and `_array.shift` remove the last or first item.
- `_array.at` returns the item at an index, with negative indices counting back from the end (`-1` is the last item).
- `_array.findLast`, `_array.findLastIndex` and `_array.flatMap` work like their JavaScript counterparts.
- `_array.from` creates a new array from an array, a string, or `{ length: n }`, with an optional callback that receives each item and its index. For example `_array.from: { on: { length: 3 }, callback: { _function: { __args: 1 } } }` gives `[0, 1, 2]`, and it can be combined with `_array.fill` to repeat a value.

Like `_array.splice`, the methods that change an array (`push`, `unshift`, `pop`, `shift`) return the changed array rather than JavaScript's new length or removed item. Closes #1315.
