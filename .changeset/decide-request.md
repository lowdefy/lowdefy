---
'@lowdefy/ai-utils': minor
'@lowdefy/build': minor
'@lowdefy/connection-ai-gateway': minor
'@lowdefy/connection-anthropic': minor
'@lowdefy/connection-google': minor
'@lowdefy/connection-openai': minor
'@lowdefy/docs': minor
'@lowdefy/docs-content': minor
---

feat(ai): New `Decide` request for typed AI decisions

`Decide` asks typed questions about a state — pick one of these options (`choice` + `options`),
is this true (`yesno`), where does this sit on a scale (`score` + `levels`) — and returns each
answer in its declared shape with a confidence, so a routine can branch on
`_step: triage.team.choice` and send a low-confidence answer to a person.

- On the `AIGateway` connection it asks an evaluation model by default, such as TypeSafe's Jev
  (`typesafe-ai/jev`): a probability for every option in one pass, billed on input tokens only.
- On every AI connection, `backend: structured-output` asks any language model for the same answers
  as schema-checked structured output.
- The build checks a routine against the questions it declares: a branch that compares an answer
  with a name that is not one of its options, or a `_step` reference to a question or field the
  step does not have, is a build error instead of a branch that never matches.

The docs gain an AI Gateway connection page.
