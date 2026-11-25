---
'@lowdefy/build': patch
---

perf(build): Walk already-keyed config faster in the later `addKeys` passes

The build's second and third `addKeys` passes walk the whole config to key the objects earlier build steps made, and on a large app nearly every node they visit is already keyed. They now build a node's path segment only when the node is new, and test each child's kind once, so a pass over 1.7 million keyed nodes takes about 0.6 s instead of about 1 s. The keys and the key map are unchanged.
