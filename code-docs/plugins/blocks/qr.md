# @lowdefy/blocks-qr

QR code generation block for Lowdefy.

## Block

| Block    | Purpose           |
| -------- | ----------------- |
| `QRCode` | Generate QR codes |

## Usage

```yaml
- id: qrCode
  type: QRCode
  properties:
    value: https://example.com
    size: 200
```

## Properties

| Property        | Purpose                       | Default  |
| --------------- | ----------------------------- | -------- |
| `value`         | Content to encode             | Required |
| `size`          | Size in pixels                | 128      |
| `level`         | Error correction (L, M, Q, H) | L        |
| `bgColor`       | Background color              | #ffffff  |
| `fgColor`       | Foreground color              | #000000  |
| `includeMargin` | Add quiet zone                | false    |

## Dynamic QR Codes

Generate QR codes from state:

```yaml
- id: ticketQR
  type: QRCode
  properties:
    value:
      _string:
        - 'ticket:'
        - _state: ticketId
    size: 256
    level: H # High error correction for reliability
```
