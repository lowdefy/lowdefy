---
'@lowdefy/blocks-antd': minor
---

feat: ButtonSelector gains a `variant` (`solid` | `outlined`) property matching the Button block, and `color` now applies consistently across both styles.

The `buttonStyle` (`solid` | `outline`) property is deprecated in favor of `variant`; it still works as an alias. `color` fixes:

Previously `color` was applied as a Radio component-level token, so antd did not re-derive the dependent tokens — the selected solid background, hover/active states, and outline border/text kept using the default primary color, and the selected solid button could render low-contrast text on the colored background.

- `color` is now applied as a global `colorPrimary` token, so the full palette (solid background, hover/active, outline border/text) is re-derived from it. This also means it works correctly under `darkModeToggle` / `darkAlgorithm` — the nested `ConfigProvider` inherits the parent algorithm.
- The selected button's text now auto-contrasts (black or white, chosen by the background color's luminance) so it stays readable on any `color`, including light/pastel values.
- In `outline` mode the selected item now gets a low-opacity tint of the active color as its background, giving it visual emphasis. The tint also applies with the default primary color when no `color` is set.
