---
'@lowdefy/engine': patch
---

fix(engine): CallAPI renders its loading state when the call starts

CallAPI now runs a pass when the call starts, as a request does, so `_api: <endpointId>.loading` shows `true` for the whole call. Before, nothing re-rendered until the call answered, so a loading indicator never showed. `_api` reads without `holdValue` now go to `null` as soon as a call starts, the same as `_request`; before they did so only if another pass ran during the call. Call with `holdValue: true` to keep the previous response on screen and read `loading`.
