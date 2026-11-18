---
'@lowdefy/server-dev': patch
---

fix(deps): Update chokidar to 6.0.0

The dev server's file watcher is rewritten in chokidar 6: every reported change is checked against the file system before it is passed on, and macOS and Windows use one recursive native watch per watched directory. It fixes missed changes to files in a newly created directory, to a file deleted and created again, and after the second save of a file, and duplicate reports of unchanged files.
