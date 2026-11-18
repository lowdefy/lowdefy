---
'@lowdefy/client': major
'@lowdefy/server-dev': major
---

fix(deps)!: Update tinykeys to 4.0.1

The keyboard `shortcut` on block events now runs on tinykeys 4. What a shortcut does in a form field stays as documented: a shortcut with a modifier (`mod+S`) fires while the user types in an input, and one without a modifier (`/`, `Escape`, `g i`) does not. No config changes are needed. End users will notice these changes:

- **A held key fires a shortcut once.** Holding `mod+S` used to fire the event again on every key repeat, which could send the same request many times. Holding the keys now fires it once. If a shortcut was meant to repeat while held (moving through a list with `ArrowDown`), the user now presses the key once per step.
- **Typing with an input method editor no longer fires shortcuts.** Key presses that are part of composing Chinese, Japanese or Korean text, such as the `Enter` that confirms a word, are ignored.
- **A plain-key shortcut is also suppressed in a `select` element**, as it already was in inputs, textareas and editable content. Keys typed in a form field no longer count towards a sequence: typing `g` in an input and then pressing `i` outside it no longer fires `g i`.
- **Only one shortcut fires per key press.** With a sequence `g i` and a shortcut `i` on another block, typing `g i` used to fire both. It now fires only `g i`.
- **A single key that also starts a sequence blocks one of them.** With `g` on one block and `g i` on another, both used to fire. Now only one of them ever fires, depending on which block comes first on the page. When the sequence comes first, pressing `g` does nothing and the browser console logs `tinykeys: Conflict found`.

To check whether an app is affected, look for shortcut keys used on their own that also start a sequence (`g` with `g i`), and for shortcuts that users hold down to repeat. Give the single key a different key or a modifier:

```yaml
# Before: `g` and `g i` on the same page, only one of them fires
events:
  onClick:
    shortcut: g

# After
events:
  onClick:
    shortcut: alt+G
```
