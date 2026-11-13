# Migration: QRScanner Reads Codes with BarcodeDetector

## Context

**Lowdefy 8's web `QRScanner` block (`@lowdefy/blocks-qr`) no longer uses `html5-qrcode`.** It
reads codes with the browser's `BarcodeDetector`, and with the `barcode-detector` ponyfill
(zxing-wasm) where the browser has none (iPhones, Firefox, Windows and Linux). Its config now
matches the native (mobile app) `QRScanner`, so one page config reads codes on web and mobile.

What changed:

| Lowdefy 7                                                                 | Lowdefy 8                                                                                                                                                                    |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `formatsToSupport: [QR_CODE, EAN_13]`                                     | `types: [qr, ean13]` (see the table below)                                                                                                                                   |
| `disableFlip`                                                             | Removed. zxing reads mirrored codes on its own.                                                                                                                              |
| Value `{ decodedText, result: { text, format: { formatName } } }`         | Value `{ data, type }`, for example `{ data: 'ABC-123', type: 'qr' }`                                                                                                        |
| `onScan` had no event data                                                | `onScan` event is `{ data, type }`, the same object as the value                                                                                                             |
| `onScan` fired on **every frame** a code was in view, many times a second | Fires **once**, then the scanner keeps no more reads until its `reset` method is called. `continuous: true` fires once per code, and again for the same code after 2 seconds |
| A camera that could not start failed silently                             | The block shows the reason and fires `onError` with `{ error: { name, message } }`                                                                                           |
| `fps` default 2                                                           | `fps` default 10                                                                                                                                                             |

`formatsToSupport` **never took effect** in Lowdefy 7: the block passed it where html5-qrcode
ignored it, so every scanner read every format. Renaming or dropping its values changes nothing an
app's users see. Limiting `types` now does take effect, and makes reading faster.

An app that is not migrated **still builds**. Each removed property (`formatsToSupport`,
`disableFlip`) logs a schema warning at its config location. But every read of the old value
(`decodedText`, `result.…`) returns nothing, and `onScan` fires once instead of continuously, so
pages that use the scanned value break without an error.

## Format Names

| `formatsToSupport` (Lowdefy 7) | `types` (Lowdefy 8)                                    |
| ------------------------------ | ------------------------------------------------------ |
| `QR_CODE`                      | `qr`                                                   |
| `AZTEC`                        | `aztec`                                                |
| `CODABAR`                      | `codabar`                                              |
| `CODE_39`                      | `code39`                                               |
| `CODE_93`                      | `code93`                                               |
| `CODE_128`                     | `code128`                                              |
| `DATA_MATRIX`                  | `datamatrix`                                           |
| `ITF`                          | `itf14`                                                |
| `EAN_13`                       | `ean13`                                                |
| `EAN_8`                        | `ean8`                                                 |
| `PDF_417`                      | `pdf417`                                               |
| `UPC_A`                        | `upc_a`                                                |
| `UPC_E`                        | `upc_e`                                                |
| `MAXICODE`                     | `maxicode`                                             |
| `RSS_14`                       | `databar`                                              |
| `RSS_EXPANDED`                 | `databar_expanded`                                     |
| `UPC_EAN_EXTENSION`            | **None.** Drop it and report it; add-ons are not read. |

The same names are the values of `type` in the scanned value, so `formatName` comparisons map with
this table too (`formatName == 'QR_CODE'` becomes `type == 'qr'`).

## What to Do

Skip `node_modules/`, `.lowdefy/`, `.git/` and build output folders in every step.

### 1. Find every QRScanner and every read of its value

```
grep -rnE 'QRScanner|formatsToSupport|disableFlip|decodedText|formatName' \
  --include='*.yaml' --include='*.yml' --include='*.njk' --include='*.json' --include='*.js' \
  --exclude-dir=node_modules --exclude-dir=.lowdefy .
```

For each block with `type: QRScanner`, note its `id`. The scanned value lives in state at that id,
so search for every read of it as well: `_state: <id>`, `_state: <id>.…`, `_get` with `from:
_state` and a key starting with `<id>`, `_event` inside the block's own `onScan`, and requests or
actions that pass `_state: <id>` on. Block ids built at runtime or in `_ref` vars may need the
`_ref` files they come from.

The native QRScanner (mobile pages, `@lowdefy/blocks-native`) already uses `types`, `continuous`
and `{ data, type }`. Leave it unchanged; this step is only for web pages.

### 2. Rewrite the block

- Rename `formatsToSupport` to `types` and map each value with the table above. Drop
  `UPC_EAN_EXTENSION` and report it. If the list is empty afterwards, remove `types` (all types).
- Remove `disableFlip`.
- Add `continuous: true` unless the block's `onScan` stops the scanner (a `CallMethod` of the
  block's own `stop` method, or one that hides or unmounts it). Lowdefy 7 never stopped on its
  own, so `continuous: true` keeps a scanner that reads code after code working. With it each code
  fires once instead of on every frame, so `onScan` actions that guarded against repeats (a
  "last scanned" check) still work and can be simplified. Report each block you left single-scan.
- Keep `fps`, `qrbox`, `aspectRatio`, `facingMode` and `inactiveByDefault` as they are.

```yaml
# Before
- id: scanner
  type: QRScanner
  properties:
    fps: 10
    qrbox: 250
    disableFlip: true
    formatsToSupport:
      - QR_CODE
      - EAN_13
  events:
    onScan:
      - id: save
        type: SetState
        params:
          code:
            _state: scanner.decodedText
# After
- id: scanner
  type: QRScanner
  properties:
    fps: 10
    qrbox: 250
    continuous: true
    types:
      - qr
      - ean13
  events:
    onScan:
      - id: save
        type: SetState
        params:
          code:
            _event: data
```

### 3. Rewrite reads of the value

| Lowdefy 7 read                                         | Lowdefy 8 read                                                 |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `<id>.decodedText`                                     | `<id>.data`                                                    |
| `<id>.result.text`                                     | `<id>.data`                                                    |
| `<id>.result.format.formatName`                        | `<id>.type`                                                    |
| `<id>.result.format.format` (a number)                 | `<id>.type` (a name; rewrite comparisons with the table above) |
| `<id>.result.decodedTextType`, `.debugData`, `.bounds` | None. Report it.                                               |

In the block's own `onScan`, prefer `_event: data` and `_event: type`: the event carries the read
that fired it, while state holds the latest read.

A read of the whole value (`_state: <id>` passed to a request, stored or logged) now sends
`{ data, type }` instead of html5-qrcode's object. Rewrite consumers you can see in the app (a
request that reads `payload.scan.decodedText`, a connection or API routine) to the new fields, and
report what reads it outside the app (an external API or stored documents).

### 4. Check the build and report

Run `lowdefy build`. There should be no `formatsToSupport` or `disableFlip` schema warnings.

Report, per QRScanner: the format values dropped (`UPC_EAN_EXTENSION`), whether it was made
`continuous`, each value read you rewrote, and each read you could not (runtime block ids, whole
values sent outside the app, `debugData` or `bounds`).

Tell the developer about two runtime changes the config cannot show:

- **Content Security Policy.** Where the browser has no `BarcodeDetector`, the block loads a
  WebAssembly decoder from the app's own origin. An app that sets a `Content-Security-Policy`
  header needs `'wasm-unsafe-eval'` in `script-src`, or scanning fails with an `onError` on those
  browsers (all iPhones).
- **Camera errors.** A denied camera permission, a missing camera or a page not served over https
  now shows a message in the block and fires `onError`. Pages that showed their own message for a
  scanner that stayed blank can use `onError` instead.
