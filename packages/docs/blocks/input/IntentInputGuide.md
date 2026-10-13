## How it works

`IntentInput` only shows. Your app classifies:

1. The user types. Shortly after the text changes, the block fires `onClassify` with the text.
2. `onClassify` runs a classifier, typically a [`Decide`](/AIGenerateRequests) request with one `choice` question, and its answer comes back through the `answer` property.
3. The block shows the card for the answer: the slot named after the intent.

Scores move while the user is mid-word, so the shown card only changes when another intent leads two answers in a row, keeps the lead while the user pauses, or is near certain. Until a new answer arrives the block keeps the last one, so the card does not drop out between keystrokes.

## Define intents once

The same object can be the block's `intents` and the options of the `Decide` question: the block reads `label`, `icon` and `color`, and `Decide` reads `description`.

```yaml
# intents.yaml
task:
  label: Task
  icon: CircleCheck
  color: '#6366f1'
  description: Work for the team to do, like a bug to fix or a feature to build
ticket:
  label: Ticket
  icon: LifeBuoy
  color: '#f43f5e'
  description: A problem or request reported by a customer
```

```yaml
requests:
  - id: classify
    type: Decide
    connectionId: gateway
    payload:
      text:
        _state: capture.text
    properties:
      model: typesafe-ai/jev
      maxRetries: 0 # by the time a retry answers, the text has moved on
      timeout: 2500
      state:
        _payload: text
      questions:
        intent:
          choice: What the person wants to do with this text
          options:
            _build.object.assign:
              - _ref: intents.yaml
              # An escape option for text that is unfinished. Options that are not
              # intents are ignored by the block.
              - none: Too short, unclear or unfinished to tell yet

blocks:
  - id: capture
    type: IntentInput
    properties:
      placeholder: Add a task, log a ticket…
      intents:
        _ref: intents.yaml
      answer:
        _request: classify.intent
    events:
      onClassify:
        - id: classify
          type: Request
          params: classify
    slots:
      task:
        blocks: [] # the task card
      ticket:
        blocks: [] # the ticket card
```

An evaluation model such as TypeSafe's Jev (`typesafe-ai/jev` on the [AI Gateway](/AIGateway)) answers in well under a second with a probability for every option, which suits classifying as the user types. Any language model works with `backend: structured-output`. A classifier of your own works too: `answer` takes any `{ choice, confidence, probabilities }` object, such as a keyword match in [`_js`](/_js) for offline use.

## Cards

A card is a slot of ordinary blocks, so it can hold a form, a summary and the button that saves it. Let the model pick the intent and let code read the fields: parse the text in `onClassify` with [`_js`](/_js), or run a [`GenerateObject`](/AIGenerateRequests) request for the fields of the intent that was chosen.

Cards are shown while the user is still unsure too (faded, and not clickable), so give fields a fallback such as `_if_none` for text that is not complete yet.

## The value

The value is `{ text, intent, mode }`:

- `text`: what the user typed. Set `capture.text` with `SetState` to fill the box; it classifies like typed text.
- `intent`: the intent shown, or `null`.
- `mode`: `idle` (nothing recognised), `preview` (a faded card), `choose` (the user is offered the two leading intents) or `card` (the solid card). A choice the user picks shows as `card` until the answers settle on a different intent.

Use `_state: capture.intent` in other blocks and requests, and `SetState` `capture: null` after saving to clear the box.

## Confidence

`confidence` sets how sure the answer must be before the card changes how it looks. The defaults suit most classifiers:

```yaml
confidence:
  preview: 0.3 # show a faded preview from here
  show: 0.6 # show the card solid from here
  switch: 0.85 # replace the shown card at once from here
```

The block uses the provider's calibrated `confidence` for the chosen intent where the answer has one, and `probabilities` for the rest.
