---
'@lowdefy/api': minor
'@lowdefy/build': minor
'@lowdefy/operators': minor
'@lowdefy/blocks-basic': minor
'@lowdefy/server-dev': minor
'@lowdefy/docs': minor
---

feat: dynamic policies. Declare `dynamicPolicies` in `lowdefy.yaml` to render block config stored as data — generated forms, model output — through a `Dynamic` block within limits the app sets. A policy lists the blocks, actions, operators, endpoints, requests, pages and origins content may use, an optional state path it must write under, whether HTML is allowed, and size, depth and actions-per-event limits. It requires literal values wherever content names a target.

- `Dynamic` blocks take `properties.policy`. The policy's types are bundled into the page, and the resolved content is checked against the policy on every page get; a violation renders the fallback and logs each rule broken.
- New built-in routine step `ValidateDynamic` runs the same check and returns `{ valid, errors, blocks }`, with a content path, rule and message per error, for a generator to correct and retry. In a Dynamic block's endpoint, `_step: <stepId>.blocks` of a passing step with the block's policy is returned as config; all other data stays literal.
- New built-in routine step `DescribeDynamicPolicy` returns what a policy allows, with the schemas of its blocks, actions and operators, to build a model's prompt from.
- The build validates policies (installed types, exact origins, no `Dynamic` or `_operator`), checks their pages, endpoints and requests on every page that hosts them, and warns when a policy without HTML lists operators that build strings.
- Fix: a `LeaveOrganization` or `SetActiveOrganization` action in Dynamic content failed with a `TypeError` instead of resolving.
