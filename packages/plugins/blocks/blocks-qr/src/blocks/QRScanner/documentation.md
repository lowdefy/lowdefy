<TITLE>
QRScanner
</TITLE>

<DESCRIPTION>

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "additionalProperties": false,
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "fps": {
        "type": "number",
        "description": "Expected framerate of QR code scanning"
      },
      "qrbox": {
        "type": ["number", "object"],
        "description": "The dimensions for the QR scanning area. If not set, the entire area of the video stream will be used by the scanner."
      },
      "aspectRatio": {
        "type": "float",
        "default": 1,
        "description": "The aspect ratio for the video."
      },
      "disableFlip": {
        "type": "boolean",
        "description": "Disable the ability to scan QR codes that have been flipped."
      },
      "inactiveByDefault": {
        "type": "boolean",
        "default": false,
        "description": "Determines whether or not the scanner is started when it is mounted."
      },
      "formatsToSupport": {
        "type": "array",
        "description": "List of Html5QrcodeSupportedFormats to support. See <a href='https://github.com/mebjas/html5-qrcode#documentation:~:text=library.%0A%20*/%0Aenum-,Html5QrcodeSupportedFormats,-%7B%0A%20%20QR_CODE%20%3D'>more</a>.",
        "items": {
          "type": "string",
          "enum": [
            "QR_CODE",
            "AZTEC",
            "CODABAR",
            "CODE_39",
            "CODE_93",
            "CODE_128",
            "DATA_MATRIX",
            "MAXICODE",
            "ITF",
            "EAN_13",
            "EAN_8",
            "PDF_417",
            "RSS_14",
            "RSS_EXPANDED",
            "UPC_A",
            "UPC_E",
            "UPC_EAN_EXTENSION"
          ]
        }
      },
      "style": {
        "type": "object",
        "description": "Custom css properties to apply to scanner block."
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "onScan": {
        "type": "array",
        "description": "Trigger actions when code is scanned."
      }
    }
  }
}
```

</SCHEMA>

<EXAMPLES>

</EXAMPLES>
