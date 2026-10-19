---
'@lowdefy/node-utils': patch
'lowdefy': patch
---

fix: On Windows, `lowdefy dev` skips ports Windows will not bind

On Windows, ports in an excluded range (reserved by Hyper-V, WSL or Docker) refuse to bind with `EACCES`. The port check threw on that error, so `lowdefy dev` failed to start when its port or the internal port after it fell in such a range. A port that cannot be bound now counts as taken, and the next free one is used.
