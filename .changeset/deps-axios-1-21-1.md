---
'@lowdefy/connection-axios-http': patch
'lowdefy': patch
---

fix(deps): Update axios to 1.21.1

Updates `axios` to 1.21.1, which moves `follow-redirects` to 1.16.2 to fix a CVE where custom
credentials could follow redirects to another host, and fixes proxy TLS options, HTTP/2 session
reuse after GOAWAY and data URL parsing. `AxiosHttp` request results are unchanged.
