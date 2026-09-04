---
'@lowdefy/build': patch
'@lowdefy/errors': patch
---

fix(build): tenant checks are sharper and quieter

The two aggregation-pipeline checks are one recursive walk that reports every refusal the tenant wall raises at request time (a join onto a `tenant: shared` collection, `$graphLookup` at any depth without `tenant: authored`, `$out`/`$merge`/`$collStats`/`$indexStats` anywhere, and a `$search`/`$vectorSearch`/`$geoNear` entry stage at the head of any sub-pipeline) under the `tenant-lookup` slug, all in one build, with a `$graphLookup` message that names the mechanism correctly. The authored-tenant-field check no longer fails a build for reading the tenant field in a projection, sort, `$group` key or index hint. A `_state` read in a page request's properties is reported as its own bug (`request-state-empty`: requests receive `payload`, not page state) rather than a tenant leak, and a routine step's `_state` is only flagged when a `:set_state` step wrote that key from the payload. Request steps nested in a control that carries its own `stepId` are audited again, an endpoint `runAs` combined with a step `tenant: none` warns that the endpoint's scope is discarded, and build warnings no longer collapse when two different findings resolve to the same config line.
