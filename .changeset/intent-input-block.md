---
'@lowdefy/blocks-antd-x': minor
---

feat(blocks-antd-x): Add the `IntentInput` block, a text input that becomes what the user means

The user types in their own words, a classifier picks the intent, and the box grows to show that intent's slot: a faded preview while unsure, a "Did you mean" choice between the two leading intents when they are close, and the slot solid when sure. Each intent's slot holds ordinary blocks, such as a pre-filled form and the button that saves it.

The block does no classifying itself. It fires `onClassify` shortly after the text changes, and takes the answer back through `answer` in the shape of a `Decide` choice answer, so `answer: { _request: classify.intent }` wires it to an evaluation model such as TypeSafe's Jev on the AI Gateway, which answers in well under a second. Options that are not intents, such as a `none` option for unfinished text, are ignored, and the last answer is kept while the next one loads. The shown intent only changes when another intent leads two answers in a row, keeps the lead while the user pauses, or reaches `confidence.switch`, so the box does not flicker as the user types. The value is `{ text, intent, mode }`, where `mode` is `idle`, `preview`, `choose` or `committed`.
