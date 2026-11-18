---
'@lowdefy/ai-utils': patch
---

fix(deps): Update glob to 14.0.4 in @lowdefy/ai-utils

The file system tools an AI agent can use to list and search files now use glob 14 and minimatch 11. This fixes two security advisories: a glob pattern from the model can no longer slow the server down with catastrophic backtracking, and a cancelled search stops reading directories instead of carrying on after its timeout. Matching follows minimatch 11, which is closer to Bash in some edge cases.
