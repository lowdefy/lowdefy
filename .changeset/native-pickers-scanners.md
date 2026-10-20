---
'@lowdefy/shell': minor
'@lowdefy/blocks-native': minor
---

feat(mobile): Haptics, file input, photo and file pickers, code and document scanning

`Haptic` plays a selection tick, an impact or a notification haptic, and Switch, Selector, MultipleSelector, ChipSelector, SegmentedControl and full swipe actions give light feedback. Every shell picks photos and videos from Photos (`PickImage`) and files from Files (`PickFile`) with the system pickers, which need no permission, and the new `FileInput` block holds the picked files with thumbnails and a remove button. Shells on `field` add `TakePhoto`, `ScanCode` (a full-screen camera that returns the first QR code or barcode), the native `QRScanner` block, and `ScanDocument` (VisionKit and ML Kit edge detection and crop, pages as JPEG files). Every picker takes `upload: { endpointId, payload }` to send each file to an API endpoint.
