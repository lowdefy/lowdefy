---
'@lowdefy/api': patch
---

fix(api): A Dynamic blocks policy no longer reads one-word values such as `INC:42`, `R:1` or `HH:mm` as URLs. In a value no schema marks as a URL, a whole value is a URL only when it starts with a scheme the browser loads or runs (`http(s):`, `ftp:`, `ws(s):`, `file:`, `blob:`, `filesystem:`, `data:`, `javascript:`, `vbscript:`) or is protocol-relative. URL-marked properties, markdown link targets and CSS `url()` are judged as before.
