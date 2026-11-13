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

- `types: string[]`: Code types to read; all by default. One of `qr`, `ean13`, `ean8`, `code128`, `code39`, `code93`, `upc_a`, `upc_e`, `pdf417`, `datamatrix`, `aztec`, `itf14`, `codabar`, and on web only `databar`, `databar_expanded`, `maxicode`.
- `continuous: boolean`: Keep scanning after a read: each code fires `onScan` once, and again after 2 seconds. Otherwise the scanner stops after its first read until its `reset` method is called. Default `false`.
- `inactiveByDefault: boolean`: Do not open the camera when the block mounts; call `start` instead. Default `false`.
- `facingMode: 'environment' | 'user'`: The camera to use. Default `environment` (back).
- `deviceId: string`: The id of a specific camera to use, instead of `facingMode`.
- `fps: number`: Camera frames read per second. Default `10`.
- `qrbox: number | { width: number, height: number }`: The scan area in pixels, drawn over the camera and centred. Only codes inside it are read. If not set, the whole frame is read.
- `aspectRatio: number`: The aspect ratio asked of the camera. Default `1`.
- `torch: boolean`: Turn the torch on, where the camera has one.

### Events

- `onScan`: A code was read. Event `{ data, type }`.
- `onError`: The camera could not start, or the scanner stopped reading. Event `{ error: { name, message } }`, where `name` is the browser error name: `NotAllowedError` (permission denied), `NotFoundError` (no camera), `NotReadableError` (camera in use), `OverconstrainedError` (no camera matches `deviceId`) or `SecurityError` (page not served over https). The block also shows the message.

### Methods

- `start`: Open the camera and start reading codes. A single-scan scanner reads again.
- `stop`: Stop reading and release the camera.
- `reset`: Read again after a single-scan scanner has kept its first code, without restarting the camera.

### Content Security Policy

An app that sets a `Content-Security-Policy` header needs `'wasm-unsafe-eval'` in `script-src`
for browsers that use the ponyfill.

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
