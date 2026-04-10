---
'@lowdefy/helpers': patch
---

fix(helpers): Fix error serialization crash on circular structures.

Errors with circular references in nested objects (e.g., Axios HTTP error responses containing Node.js request/response cycles) crashed the logger with "Converting circular structure to JSON" instead of logging the actual error. `extractErrorProps` now deep-cleans plain objects, arrays, and non-Error causes — stripping class instances, detecting circular references, and capping object depth.
