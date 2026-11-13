# Lowdefy QR Blocks

The `QRScanner` block reads QR codes and barcodes from the device camera. It uses the browser's
[`BarcodeDetector`](https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector) where the
browser supports the requested code types (Chrome on Android, macOS and ChromeOS), and the
[`barcode-detector`](https://github.com/Sec-ant/barcode-detector) ponyfill, built on zxing-wasm,
elsewhere (iPhones, Firefox, Windows and Linux). The ponyfill's WebAssembly decoder is served by
the app itself and only downloaded by browsers that need it.

Its config matches the native (mobile app) `QRScanner`, so one page config reads codes on web and
mobile.

When a code is read, the block value is set to `{ data, type }`, for example
`{ data: 'ABC-123', type: 'qr' }`, and `onScan` fires with the same object as its event.

### Properties

- `types: string[]`: Code types to read. By default, every type the browser reads; `databar`, `databar_expanded` and `maxicode` are read only when listed. One of `qr`, `ean13`, `ean8`, `code128`, `code39`, `code93`, `upc_a`, `upc_e`, `pdf417`, `datamatrix`, `aztec`, `itf14`, `codabar`, and on web only `databar`, `databar_expanded`, `maxicode`.
- `continuous: boolean`: Keep scanning after a read: each code fires `onScan` once, and again after 2 seconds. Otherwise the scanner stops after its first read until its `reset` method is called. Default `false`.
- `inactiveByDefault: boolean`: Do not open the camera when the block mounts; call `start` instead. Default `false`.
- `facingMode: 'environment' | 'user'`: The camera to use. Default `environment` (back).
- `deviceId: string`: The id of a specific camera to use, instead of `facingMode`.
- `fps: number`: Camera frames read per second. Default `10`.
- `qrbox: number | { width: number, height: number }`: The scan area in pixels, drawn over the camera and centred. Only codes inside it are read. If not set, the whole frame is read.
- `height: number`: The height of the camera view in pixels. The video fills the width and is centred, cropped at the top and bottom if it is taller. By default, the height of the video.
- `prompt: string`: Text shown over the bottom of the camera, like "Point the camera at a code".
- `aspectRatio: number`: The aspect ratio asked of the camera. Default `1`.
- `torch: boolean`: Turn the torch on, where the camera has one.

### Events

- `onScan`: A code was read. Event `{ data, type }`.
- `onError`: The camera could not start, or the scanner stopped reading. Event `{ error: { name, message } }`, where `name` is the browser error name: `NotAllowedError` (permission denied), `NotFoundError` (no camera), `NotReadableError` (camera in use), `OverconstrainedError` (no camera matches `deviceId`), `SecurityError` (page not served over https) or `CameraEndedError` (the camera stopped while scanning: unplugged, taken by another app, or the phone locked). Other errors, like a code reader that failed to load, carry their own name and message. The block also shows the message.

### Methods

- `start`: Open the camera and start reading codes. A single-scan scanner reads again.
- `stop`: Stop reading and release the camera.
- `reset`: Read again after a single-scan scanner has kept its first code, without restarting the camera.

### Content Security Policy

Browsers that use the ponyfill compile its WebAssembly decoder, which a Content Security Policy
blocks unless `script-src` allows `'wasm-unsafe-eval'`. The policy Lowdefy writes with
`config.security.contentSecurityPolicy` does not allow it by default, so an app that turns it on
and uses `QRScanner` adds it:

```yaml
config:
  security:
    contentSecurityPolicy:
      directives:
        script-src:
          - "'wasm-unsafe-eval'"
```

Without it, scanning fails on iPhones, Firefox, Windows and Linux with an `onError` when the
camera starts. A policy set some other way (a proxy or CDN header) needs the same source.

## Examples

```yaml
- id: qr_scanner
  type: QRScanner
  properties:
    types:
      - qr
    qrbox: 250
  events:
    onScan:
      - id: save_code
        type: SetState
        params:
          code:
            _event: data
```
