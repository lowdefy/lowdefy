---
'@lowdefy/build': patch
'@lowdefy/engine': patch
---

fix: Operators in `class` no longer give schema warnings, and a page's own `class` reaches the page

- **Operators in `class` pass the build's schema check (`@lowdefy/build`).** `class: { _if: ... }`, operators as slot values (`class: { .element: { _if: ... } }`) and operators inside a class array printed false `"_if" must be string` or `".element" must be string` warnings, although the operators were evaluated at runtime as expected. An operator is now accepted anywhere a class string is. A `class` of the wrong type now gets the `Block "class" should be ...` message instead of a bare type error.
- **Page-level `class` is applied (`@lowdefy/engine`).** A `class` set on the page block (for example `class: { .menu: ... }` on `PageSiderMenu`) was dropped before the page rendered, while `style` on the page worked. It now reaches the page block the same way `style` does.
