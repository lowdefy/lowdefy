---
'@lowdefy/block-utils': minor
'@lowdefy/build': patch
'@lowdefy/client': minor
'@lowdefy/helpers': minor
'@lowdefy/blocks-basic': minor
'@lowdefy/blocks-aggrid': patch
'@lowdefy/server-dev': patch
'lowdefy': patch
'@lowdefy/docs': minor
---

feat: dates, numbers, avatars, copy buttons, truncation, text tones and confirmations in HTML.

- **Dates.** `<time datetime="…" data-time="relative">` shows "3 hours ago" and keeps it current, with the exact time on hover. `date`, `datetime` and `time` use the app's locale, and any other value is a dayjs format. Dates show in the reader's time zone.
- **Numbers.** `data-format` formats the element's number as `number`, `currency` (with `data-currency="USD"`), `percent`, `compact` or `bytes`, with the same formatting as the ag-grid `number` cells; `data-decimals` fixes the decimals.
- **Avatars.** `data-avatar="Jane Doe"` renders initials in a theme colour, the same as the ag-grid `avatar` cells, and on an `<img>` replaces a missing or broken image. No image service is called.
- **Copy.** `data-copy` adds an accessible copy button for the element's text or the attribute's value. The copy and check icons are always bundled, and the labels are the new `client.copy`, `client.copyValue`, `client.copied` and `client.copyFailed` translation keys.
- **Truncation.** `data-truncate` (or `data-truncate="3"`) clamps text to 1–6 lines with an ellipsis and shows the full text in a tooltip only when it is cut off, the same clamp as the ag-grid `ellipsis` columns.
- **Text tone.** `data-tone="secondary"` (also `tertiary`, `quaternary`, `success`, `warning`, `error`, `info`) colours text with theme tokens that follow dark mode.
- **Confirm.** In `ClickableHtml`, `data-confirm="Delete this row?"` on a `data-event` element opens a themed confirmation first; only OK fires the event, once. Focus moves to Cancel and returns afterwards, and Escape cancels. A bare `data-confirm` asks the new `client.confirm` message ("Are you sure?").
- **Keyboard.** Space now activates focusable `data-event` targets and popover triggers on key up, like a native button.
