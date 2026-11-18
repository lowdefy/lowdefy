---
'@lowdefy/api': patch
'@lowdefy/plugin-better-auth': patch
---

fix(deps): Update jose to 6.2.17

Updates `jose` to 6.2.17, which hardens JWT, JWS and JWKS validation (stricter header, claim and
duration checks, bounded JWE decompression) used when verifying API bearer tokens and MCP access
tokens.
