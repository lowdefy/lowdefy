---
'@lowdefy/blocks-antd': minor
---

feat(blocks-antd): `TitleInput` and `ParagraphInput` edit in place like a proper inline title. Click the text to edit it where you clicked. The text keeps its font, size and position while editing, and gets a focus ring instead of a bordered box that jumped 12px into the margin with an enter glyph. Hovering editable text shows a soft background, and the text can be focused with Tab and edited with Enter or F2. Enter saves, Escape cancels without closing a surrounding modal, and clicking away saves. `onChange` fires only when the value changed.

No edit icon is shown by default any more. Set `editable.icon` (for example `icon: edit`) to add one. Edit and copy icons are muted, sized to the text instead of the heading font (so an `h1` no longer gets a heading-sized pencil), and drawn with the app's icon set. The new `placeholder` property (default `Untitled` for `TitleInput`, `Empty` for `ParagraphInput`) is shown when the value is empty, instead of a lone pencil. With no icon, `editable.tooltip` shows on the text. `onCopy` now also fires for `copyable: true`, and `ParagraphInput` fires `onExpand` (not `onCopy`) when its ellipsis is expanded.
