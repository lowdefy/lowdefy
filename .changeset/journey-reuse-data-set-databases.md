---
'@lowdefy/test-utils': patch
---

perf(test-utils): Reuse data set databases between journeys

A data set journey created its databases when it started and dropped them when it ended, which took about 0.6 s a journey on macOS. A finished journey's databases are now kept for the next journey on the same data set, which empties them and writes the data set again. Each data set collection is also written in one bulk write instead of one write per fixture.

Each journey still starts from exactly its data set: a collection whose indexes changed, a view, and a collection the last journey made with an index of its own are dropped and loaded again. Journeys open at the same time never share databases, each gets a new data cookie, and a journey whose background work outlived the 30 s wait drops its databases as before.
