---
'@lowdefy/connection-mongodb': patch
'@lowdefy/helpers': patch
'@lowdefy/operators-change-case': patch
---

fix(deps): Update change-case to 5.4.4

change-case 5.4.4 removes a regular expression lookbehind that older browsers do not support, and passes options through every level of nested keys.
