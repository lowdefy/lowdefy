---
'@lowdefy/engine': patch
---

perf(engine): CallAPI re-evaluates only the blocks that read its endpoint

A CallAPI made the updates before and after it full passes, and its handler ran a full pass itself when the call answered, so every block on the page re-evaluated on each of them. The handler already reports the endpoint it changed (`api:<endpointId>`), which `_api` reads, so CallAPI now runs dependency-tracked passes. On a page of about 330 blocks that loads a record through CallAPI, this removed two of the five full passes a click caused.
