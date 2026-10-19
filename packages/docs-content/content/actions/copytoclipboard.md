# CopyToClipboard

```
(params: {
  copy: string
}): void
```

The `CopyToClipboard` action is used to copy content to the clipboard. It implements the [`navigator.clipboard.writeText`](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText) web API.

#### Parameters

###### object
  - `copy: string`: __Required__ - Text to be copied to the clipboard.

#### Examples

###### Copy text button:
```yaml
- id: copy_button
  type: Button
  properties:
    title: Copy Text
  events:
    onClick:
      - id: copy
        type: CopyToClipboard
        params:
          copy: Lorem ipsum dolor sit amet
        messages:
          success: Copied!
```
