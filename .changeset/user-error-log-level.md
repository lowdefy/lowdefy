---
'@lowdefy/api': patch
---

fix: A Dynamic block whose endpoint routine ends with `:reject` is logged once, as the warning the reject writes. It is no longer logged again at error level when the fallback renders.
