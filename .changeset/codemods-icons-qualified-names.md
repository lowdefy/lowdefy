---
'@lowdefy/codemods': patch
---

The v7 icon migration leaves set-qualified names such as `react-icons:FaWhatsapp` as they are, so running it again changes nothing, and it notes that `PiSquare` is also a Lucide name (a pi sign in a square) that v7 resolves without an error.
