---
'lowdefy': patch
'@lowdefy/docs-content': patch
---

fix(cli): `lowdefy journeys explore` counts failed model calls that may have been billed toward `--max-cost`

A model call that failed after its retries used to add nothing to the run's spend, although the model may have answered before the call failed (for example, an answer that did not match the expected shape). A run that alternated failed and successful calls could then spend well past `--max-cost`. Such a failed call is now charged at the same estimate as a call that reports no cost, from the tokens the error reports when it has them, and the run warns that the cap is working from an estimate. A call the Gateway refused, or one that got no response (a network failure, a timeout or an abort), still costs nothing.
