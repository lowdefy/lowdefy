---
'@lowdefy/blocks-qr': major
'@lowdefy/server-dev': patch
'@lowdefy/block-utils': minor
'@lowdefy/blocks-native': patch
'@lowdefy/codemods': minor
---

feat!: QRScanner reads codes with BarcodeDetector and takes the native QRScanner config

The web `QRScanner` no longer uses `html5-qrcode`, which has been unmaintained since April 2023. It reads codes with the browser's `BarcodeDetector` where the browser supports the requested types (Chrome on Android, macOS and ChromeOS), and with the `barcode-detector` ponyfill (zxing-wasm) elsewhere (iPhones, Firefox, Windows and Linux). The ponyfill's WebAssembly decoder is served by the app, never a CDN, and only downloaded by browsers that need it; html5-qrcode's 108 KB (gzip) is gone for every browser.

Its config now matches the native (mobile app) `QRScanner`:

- `formatsToSupport` is replaced by `types`, with the native names (`qr`, `ean13`, `code128`, …; `databar`, `databar_expanded` and `maxicode` on web only). `formatsToSupport` never took effect in Lowdefy 7, so every scanner read every format.
- The value and the `onScan` event are `{ data, type }` instead of html5-qrcode's `{ decodedText, result }`.
- `onScan` fires once per read instead of on every frame a code is in view. A scanner stops after its first read until `reset` is called; `continuous: true` keeps scanning, firing once per code and again for the same code after 2 seconds.
- New: `onError` (camera permission denied, no camera, camera in use, page not served over https, camera stopped while scanning; the block also shows the message), `reset` method, `deviceId`, `torch`, and the native block's `height` and `prompt`.
- `disableFlip` is removed. `fps` defaults to 10 (was 2).

An app that turns on `config.security.contentSecurityPolicy`, or sets a `Content-Security-Policy` header some other way, needs `'wasm-unsafe-eval'` in `script-src` for browsers that use the ponyfill: add it under `config.security.contentSecurityPolicy.directives.script-src`.

To migrate an app, run `lowdefy upgrade`. Its Lowdefy 8 step, `qrscanner-barcode-detector`, renames `formatsToSupport` to `types`, removes `disableFlip`, adds `continuous: true` where `onScan` expects repeated reads, rewrites reads of `decodedText` and `result.format.formatName` to `data` and `type`, adds `'wasm-unsafe-eval'` to the app's `config.security.contentSecurityPolicy` when it has one, and reports what it cannot rewrite.

`createScanFilter`, the rules that decide which camera reads fire `onScan`, moves to `@lowdefy/block-utils`, so the web and native `QRScanner` share one copy.

The dev server now lets Vite serve files from the workspace of each linked (`link:`) package, so a linked plugin's `?url` imports (such as QRScanner's decoder) load in development.
