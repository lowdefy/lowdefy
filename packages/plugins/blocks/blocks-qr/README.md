# Lowdefy QR Blocks

This is a Lowdefy blocks wrapper for the [HTML5 QR code & barcode reader](https://github.com/mebjas/html5-qrcode).

See the [HTML5 QR code docs](https://github.com/mebjas/html5-qrcode#documentation) for the scanner config.

When a code is scanned by the QR scanner, the value of the block is set to the decoded result from the scan. The value is an object, which has the following fields:

- `decodedText: string;`
- `result: QrcodeResult;`

### Properties

- `fps: number`: Expected framerate of QR code scanning.
- `qrbox: number | {width: number, height: number}`: The dimensions for the QR scanning area. If not set, the entire area of the video stream will be used by the scanner.
- `aspectRatio: float`: The aspect ratio for the video.
- `disableFlip: boolean`: Disable the ability to scan QR codes that have been flipped.
- `formatsToSupport: List of Html5QrcodeSupportedFormats`: Limit the code formats that can be scanned. See [Html5QrcodeSupportedFormats](https://github.com/mebjas/html5-qrcode#documentation:~:text=library.%0A%20*/%0Aenum-,Html5QrcodeSupportedFormats,-%7B%0A%20%20QR_CODE%20%3D).
- `inactiveByDefault: boolean`: Determines whether or not the scanner is started when it is mounted.
- `style: cssObject`: A style object applied to the scanner element.

### Events

- `onScan`: Trigger onScan actions when a qr code is scanned.

### Methods

- `start`: Start the QR scanner.
- `stop`: Stop the QR scanner.

## Examples

1. Simple use of QRScanner

```yaml
- id: qr_scanner
  type: QRScanner
```

To obtain the result from the scan use:
```yaml
  _state: qr_scanner
```
