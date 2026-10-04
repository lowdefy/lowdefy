---
'lowdefy': minor
---

`lowdefy journeys explore` asks `typesafe-ai/jev` by default when `AI_GATEWAY_API_KEY` is set. If the Gateway refuses Jev, or Jev rejects a request as over its limits, the run switches to the structured-output model (`--model`, else `LOWDEFY_EXPLORER_MODEL`, else `google/gemini-2.5-flash-lite`) for the rest of the run, and says so in its progress and report. Jev has no zero-data-retention endpoint, so use `--policy model` if your app needs one.
