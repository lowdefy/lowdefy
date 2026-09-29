---
'lowdefy': patch
---

Fetching the server no longer deletes files in the server directory that are not part of the server. `lowdefy build --server-directory <dir>` replaced the whole directory, so a Vercel deploy directory lost its own build scripts and the build step failed with `vercel.build.sh: No such file or directory`. The server's files now replace their namesakes one by one, `package.json` last, and everything else stays.
