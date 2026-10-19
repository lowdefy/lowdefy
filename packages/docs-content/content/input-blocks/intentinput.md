# IntentInput

A text input that becomes what the user means. The user types in their own words, a classifier (typically a `Decide` request) picks the intent, and the box grows to show that intent's slot: a faded preview while unsure, a choice between two intents when they are close, and the slot solid when sure. Each intent's slot holds ordinary blocks.

## How it works

`IntentInput` only shows. Your app classifies:

1. The user types. Shortly after the text changes, the block fires `onClassify` with the text.
2. `onClassify` runs a classifier, typically a [`Decide`](/AIGenerateRequests) request with one `choice` question, and its answer comes back through the `answer` property. The block reads `answer` when the `onClassify` actions finish, so set it in those actions (a `Request` does).
3. The block shows the slot named after the intent in the answer.

Scores move while the user is mid-word, so the shown intent only changes when another intent leads two answers in a row, keeps the lead while the user pauses, or is near certain. Until a new answer arrives the block keeps the last one, so the slot does not drop out between keystrokes.

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
        blocks: [] # what a task shows
      ticket:
        blocks: [] # what a ticket shows
```

An evaluation model such as TypeSafe's Jev (`typesafe-ai/jev` on the [AI Gateway](/AIGateway)) answers in well under a second with a probability for every option, which suits classifying as the user types. Any language model works with `backend: structured-output`. A classifier of your own works too: `answer` takes any `{ choice, confidence, probabilities }` object, such as a keyword match in [`_js`](/_js) for offline use.

## Slots

Each intent's slot holds ordinary blocks, so it can hold a form, a summary and the button that saves it. Let the model pick the intent and let code read the fields: parse the text in `onClassify` with [`_js`](/_js), or run a [`GenerateObject`](/AIGenerateRequests) request for the fields of the intent that was chosen.

A slot is shown while the user is still unsure too (faded, and not clickable), so give fields a fallback such as `_if_none` for text that is not complete yet.

The blocks of every slot exist while only one is shown, so a `Validate` with no params also checks the required fields of the slots that are hidden. Pass the shown slot's block ids, such as `params: [task_title, task_due]`.

## The value

The value is `{ text, intent, mode }`:

- `text`: what the user typed. Set `capture.text` with `SetState` to fill the box; it classifies like typed text.
- `intent`: the intent shown, or `null`.
- `mode`: `idle` (nothing recognised), `preview` (the slot, faded), `choose` (the user is offered the two leading intents) or `committed` (the slot, solid). A choice the user picks is `committed` until the answers settle on a different intent.

Use `_state: capture.intent` in other blocks and requests, and `SetState` `capture: null` after saving to clear the box.

## Confidence

`confidence` sets how sure the answer must be before the slot changes how it looks. The defaults suit most classifiers:

```yaml
confidence:
  preview: 0.3 # show a faded preview from here
  show: 0.6 # commit and show the slot solid from here
  switch: 0.85 # replace the shown intent at once from here
```

The block uses the provider's calibrated `confidence` for the chosen intent where the answer has one, and scales the `probabilities` of the other intents to keep their ratio to it, so the chosen intent always leads.

```yaml
- id: capture_demo
  type: IntentInput
  properties:
    placeholder: Try "fix the login bug" or "sync with Sam friday 2pm"
    intents:
      task:
        label: Task
        icon: CircleCheck
        color: "#6366f1"
      meeting:
        label: Meeting
        icon: Calendar
        color: "#0ea5e9"
    answer:
      _state: capture_demo_answer
  events:
    onClassify:
      - id: classify
        type: SetState
        params:
          capture_demo_answer:
            _js:
              fn: >
                const text = args.text.toLowerCase();

                const probabilities = { task: 0.05, meeting: 0.05 };

                if (/^(fix|add|build|update|remove)\b/.test(text))
                probabilities.task = 0.9;

                if (/\b(sync|meeting|call|standup)\b/.test(text)) {
                  probabilities.meeting = /\d|today|tomorrow|day\b/.test(text) ? 0.9 : 0.4;
                }

                return { probabilities };
              args:
                text:
                  _event: text
  slots:
    task:
      blocks:
        - id: capture_demo_task
          type: Paragraph
          properties:
            content:
              _string.concat:
                - "New task: "
                - _state: capture_demo.text
        - id: capture_demo_create
          type: Button
          properties:
            title: Create task
            type: primary
    meeting:
      blocks:
        - id: capture_demo_meeting
          type: Paragraph
          properties:
            content:
              _string.concat:
                - "New meeting: "
                - _state: capture_demo.text
        - id: capture_demo_invite
          type: Button
          properties:
            title: Send invite
            type: primary
```

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `autoFocus` | boolean | - | Focus the input on mount. |
| `placeholder` | string | - | Placeholder text. |
| `intents` | object | - | The intents the text can become, by name. Each name is also the slot shown for it. The same object can be the options of the Decide question that classifies the text. |
| `answer` | object \| null | - | The classification of the current text, in the shape of a Decide choice answer: `_request: classify.intent`. Options that are not intents, such as a `none` option, are ignored. While a new answer loads, the last one is kept. |
| `answer.choice` | string \| null | - |  |
| `answer.confidence` | number \| null | - |  |
| `answer.probabilities` | object \| null | - |  |
| `confidence` | object | - | How sure the answer must be before the slot changes how it looks. |
| `confidence.preview` | number | `0.3` | Show a faded preview of the slot from this confidence. |
| `confidence.show` | number | `0.6` | Commit to the intent and show its slot solid from this confidence. |
| `confidence.switch` | number | `0.85` | Replace the shown intent at once from this confidence. Below it, another intent must lead twice in a row, or hold the lead while the user pauses. |

| Event | Event Data | Description |
| --- | --- | --- |
| `onChange` | `{ text }` | Trigger actions when the user types. |
| `onClassify` | `{ text }` | Trigger actions shortly after the text changes, to classify it. Typically runs a Decide request whose answer is passed back as `answer`. |
| `onIntentChange` | `{ intent, mode }` | Trigger actions when the shown intent or its mode changes. |
| `onSubmit` | `{ text, intent, mode }` | Trigger actions when Enter is pressed. |

| Key | Target |
| --- | --- |
| `/block` | Outer block wrapper (always available). |
| `/element` | The IntentInput element. |

Slot keys are user-defined in your config and resolved at build time — not generated at runtime. The block typically pairs slots with an array property (`tabs`, `panels`, `slides`) listed in the Properties table; see the examples above for the expected shape.
