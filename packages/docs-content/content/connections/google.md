# Google

The Google connection connects to the [Google Gemini API](https://ai.google.dev/docs) and provides the `GeminiAgent` agent type for use with [Lowdefy agents](/agents-introduction).

> The Google connection is provided by the `@lowdefy/connection-google` package, which is included by default.

## Connections

### Google

#### Properties
- `apiKey: string`: __Required__ - Google API key. Use [`_secret`](/_secret) to reference this securely.
- `baseURL: string`: Optional base URL for the Google API.
- `maxOutputTokens: number`: Default maximum number of tokens a model call generates, for the requests and agents on this connection that do not set their own.
- `timeout: number`: Default milliseconds a model call may take, retries included, before it is cancelled, for the requests and agents on this connection that do not set their own. See _Limits and cancellation_ below.

###### Connection example:
```yaml
connections:
  - id: google
    type: Google
    properties:
      apiKey:
        _secret: GOOGLE_API_KEY
```

## Agent Types

### GeminiAgent

The `GeminiAgent` supports all [common agent properties](/agents-introduction) plus the following:

| Property | Type | Description |
| --- | --- | --- |
| `thinkingConfig` | object | Configuration for the model's thinking process. |
| `thinkingConfig.thinkingBudget` | integer | Maximum thinking tokens (Gemini 2.5 models). Set to `0` to disable. |
| `thinkingConfig.thinkingLevel` | string | Thinking depth (Gemini 3 models): `'minimal'`, `'low'`, `'medium'`, or `'high'`. |
| `thinkingConfig.includeThoughts` | boolean | Return thought summaries in the response. |
| `safetySettings` | object[] | Safety filter settings. |
| `safetySettings[].category` | string | Safety category (e.g. `'HARM_CATEGORY_DANGEROUS_CONTENT'`). |
| `safetySettings[].threshold` | string | Block threshold (e.g. `'BLOCK_ONLY_HIGH'`, `'BLOCK_NONE'`). |

###### Agent with thinking enabled:
```yaml
connections:
  - id: google
    type: Google
    properties:
      apiKey:
        _secret: GOOGLE_API_KEY

agents:
  - id: research_agent
    type: GeminiAgent
    connectionId: google
    properties:
      model: gemini-2.5-pro
      thinkingConfig:
        thinkingBudget: 8000
        includeThoughts: true
      instructions: |
        You are a research assistant. Search for information
        and provide well-sourced answers. Think through
        complex questions step by step.
      maxSteps: 8
    tools:
      - search-knowledge-base
      - get-document
```

###### Agent with safety settings:
```yaml
agents:
  - id: creative_writer
    type: GeminiAgent
    connectionId: google
    properties:
      model: gemini-2.5-pro
      temperature: 0.9
      safetySettings:
        - category: HARM_CATEGORY_DANGEROUS_CONTENT
          threshold: BLOCK_ONLY_HIGH
      instructions: You are a creative writing assistant.
```

## Requests

Request types:

- GenerateText
- GenerateObject
- Decide

All AI provider connections (`Anthropic`, `OpenAI`, `Google`, `AIGateway`) provide the same `GenerateText`, `GenerateObject` and `Decide` request types — the `connectionId` selects the provider. These make a single, one-shot model call and return the result. They can be used as page requests, or as steps in [API endpoint routines](/api) — useful for classify, extract, summarize, or decide steps where the surrounding logic stays in your routine. For a closed-vocabulary decision — pick one of these options, yes or no, rate on this scale — use `Decide`.

For multi-step tool use, see [agents](/agents-introduction) instead.

### Limits and cancellation

Two limits bound every AI request. Set them on the request, or on the connection as the default for every request and agent that uses it:

- `maxOutputTokens` caps the tokens one call generates. Without it, the provider's default applies.
- `timeout` cancels a call, retries included, that runs longer than this many milliseconds. The request fails with a `ServiceError`.

A call is also cancelled when the request that started it closes, so a provider call that nobody is waiting for stops instead of running, and billing, to its end:

- A page request, or an API endpoint called over HTTP, is cancelled when the server's request timeout (`config.requestTimeout`, default 30 seconds) answers first, which fails it with a `ServiceError`. On the Node server it is also cancelled when the client disconnects; that is logged as a warning, not an error.
- On [Vercel](/vercel), only the request timeout cancels a call: a client disconnect does not, and the call runs until it finishes, times out, or the function reaches `config.vercel.maxDuration`. Keep `config.requestTimeout` below `maxDuration`, or Vercel stops the function before the timeout can cancel anything (the build warns when it is not).
- Endpoints with `async: true`, `detached: true` calls, and scheduled runs answer at once and then run to their end: the closing request does not cancel them.
- An agent chat turn runs to its end after the client disconnects, so its `onFinish` hooks still save the conversation. Bound it with the agent's `timeout` and `maxSteps`. A `CallAgent` step is cancelled with the routine that runs it.

### Files in messages

A file part in `messages` (`{ type: 'file', data: <link>, mediaType }`) goes to the model as a link when the provider takes that media type as a link (the main providers do for images and PDFs). Any other file, such as a CSV or text file, is downloaded by the server and sent as content, within the request's `fileDownload` limits. The server downloads only an `https:` link to a public address, checking the address on every redirect, and a failed download names the file's host, never its link, so a signed link stays out of the server log. `Decide` takes no files.

When a provider rate-limits a call (HTTP 429), the model client retries it (`maxRetries`), waiting as long as the provider's `Retry-After` asks, up to a minute. If the retries run out, the request fails with a `ServiceError`, as a 429 does on every connection, and the server log records the `Retry-After` value.

### GenerateText

Generates text from a prompt.

#### Properties

- `model: string`: **Required** - Model id to generate with.
- `prompt: string`: Text prompt. Use either `prompt` or `messages`, not both.
- `messages: object[]`: Model messages (`{ role, content }`). Use either `prompt` or `messages`, not both.
- `system: string`: System prompt.
- `allowSystemInMessages: boolean`: Default: `false` - Allow `system` role messages in `messages`. A system message instructs the model as the app itself, so without this a request whose `messages` include one fails. Only set it when the messages come from the app, never from a user (for example a message list built from `_payload`). Use `system` for the system prompt.
- `maxOutputTokens: number`: Maximum number of tokens to generate. Defaults to the connection's `maxOutputTokens`.
- `timeout: number`: Milliseconds the model call may take, retries included, before it is cancelled. Defaults to the connection's `timeout`.
- `fileDownload: object`: Limits on a file in `messages` the server downloads (see [Files in messages](#files-in-messages)).
  - `maxBytes: integer`: Default: `20971520` (20 MB) - Largest file the server downloads. A larger file fails the request.
  - `timeout: integer`: Default: `30000` - Milliseconds a file download may take.
- `temperature: number`: Sampling temperature (0 to 2).
- `topP: number`: Nucleus sampling.
- `topK: number`: Only sample from the top K options for each subsequent token.
- `frequencyPenalty: number`: Penalize repeated tokens by frequency.
- `presencePenalty: number`: Penalize tokens that have already appeared.
- `seed: number`: Seed for deterministic sampling, if supported by the model.
- `stopSequences: string[]`: Sequences that stop generation.
- `maxRetries: number`: Maximum number of retries. Defaults to 2.
- `providerOptions: object`: Provider-specific options, keyed by provider (e.g. `anthropic`, `openai`, `google`).

#### Response

```yaml
text: string # The generated text.
reasoningText: string # Reasoning text, when the model produced any.
finishReason: string # 'stop', 'length', 'content-filter', ...
usage: object # Token usage ({ inputTokens, outputTokens, totalTokens, ... }).
providerMetadata: object # Provider-specific metadata, when returned.
warnings: array # Call warnings from the provider, when returned.
```

#### Examples

###### Summarize text in an API endpoint routine:

```yaml
api:
  - id: summarize-text
    type: Api
    routine:
      - id: summarize
        type: GenerateText
        connectionId: claude
        properties:
          model: claude-haiku-4-5
          system: You are a concise summarizer.
          prompt:
            _payload: text
      - ':return':
          summary:
            _step: summarize.text
```

###### Text generation as a page request:

```yaml
requests:
  - id: generate_reply
    type: GenerateText
    connectionId: claude
    payload:
      message:
        _state: customer_message
    properties:
      model: claude-haiku-4-5
      system: Draft a friendly reply to the customer message.
      prompt:
        _payload: message
```

### GenerateObject

Generates a structured object matching a JSON Schema. Ideal for classification, extraction, and routing decisions — the result lands in `_step` (or `_request`) as plain data your config can act on.

#### Properties

Takes the same properties as `GenerateText`, except `stopSequences`, plus:

- `schema: object`: **Required** - JSON Schema describing the object the model must generate.
- `schemaName: string`: Optional name for the output schema, passed to the model.
- `schemaDescription: string`: Optional description of the output schema, passed to the model.

#### Response

```yaml
object: object # The generated object, matching the schema.
reasoningText: string # Reasoning text, when the model produced any.
finishReason: string # 'stop', 'length', 'content-filter', ...
usage: object # Token usage ({ inputTokens, outputTokens, totalTokens, ... }).
providerMetadata: object # Provider-specific metadata, when returned.
warnings: array # Call warnings from the provider, when returned.
```

#### Examples

###### Classify then route in an API endpoint routine:

```yaml
api:
  - id: triage-ticket
    type: Api
    routine:
      - id: classify
        type: GenerateObject
        connectionId: claude
        properties:
          model: claude-haiku-4-5
          prompt:
            _payload: ticket_text
          schema:
            type: object
            properties:
              category:
                type: string
                enum:
                  - billing
                  - technical
                  - other
              urgent:
                type: boolean
      - ':if':
          _eq:
            - _step: classify.object.urgent
            - true
        ':then':
          - id: escalate
            type: CallApi
            properties:
              endpointId: escalate-ticket
              payload:
                category:
                  _step: classify.object.category
```

### Decide

Makes typed decisions about a piece of state: pick one of a set of options, judge a statement true or false, or place something on an ordered scale. Every answer comes back in the shape you declared, with a confidence, so a routine can branch on it — and send a low-confidence answer to a person instead.

The build knows every option, so a routine branch that compares an answer with a name that is not one of its options — `_eq: [{ _step: triage.team.choice }, bil-ling]` — fails the build rather than silently never matching. A `_step` reference to a question the step does not ask, or to a field its answer does not have, fails the build the same way.

`Decide` has two backends behind the same interface:

- `evaluation` — an evaluation model, such as TypeSafe's Jev (`typesafe-ai/jev`) on the [AI Gateway](/AIGateway). It returns a probability for every option in one pass, in under a second, and bills input tokens only. The default, and only available, on the `AIGateway` connection.
- `structured-output` — any language model, asked for the answers as structured output that follows a schema of the questions. Providers do not all enforce the schema, so Lowdefy checks each answer against its question (see `null` answers below). Available on every AI connection, and the default on `Anthropic`, `OpenAI` and `Google`. Its confidence is the model's own estimate, not a calibrated probability.

Keep the state to what the questions need: an evaluation model reads the state literally, and accuracy drops as it grows. A `Decide` is never a security boundary — text in the state can argue for its own answer.

#### Properties

- `model: string`: **Required** - Model id to decide with, e.g. `typesafe-ai/jev`. Pin a version wherever a confidence threshold is tuned — a `latest` alias changes answers on release.
- `state: string | object | array`: **Required** - What the questions are about.
- `questions: object`: **Required** - Named questions, answered together against the state. Each question id becomes a key of the response (`usage` is reserved). A question is one of:
  - `{ choice: string, options: object }` - Pick exactly one option. `options` maps option names (2 to 255) to what each one means (`null` for no description).
  - `{ yesno: string, criteria?: { yes: string, no: string } }` - Judge a statement true or false. `criteria` optionally says what counts as yes and as no.
  - `{ score: string, levels: string[] }` - Place the state on 2 to 10 ordered levels, lowest first.
- `backend: enum`: `evaluation` or `structured-output`. Defaults to `evaluation` on `AIGateway` and `structured-output` elsewhere.
- `maxOutputTokens: number`: Maximum number of tokens to generate, on the `structured-output` backend (an evaluation model generates no text). Defaults to the connection's `maxOutputTokens`.
- `timeout: number`: Milliseconds the model call may take, retries included, before it is cancelled. Defaults to the connection's `timeout`.
- `maxRetries: number`: Maximum number of retries. Defaults to 2.
- `providerOptions: object`: Provider-specific options, keyed by provider (e.g. `gateway: { zeroDataRetention: true }`).

#### Response

One key per question, plus `usage`:

```yaml
<choice question>:
  choice: string # The chosen option.
  confidence: number # 0 to 1.
  probabilities: object # Probability per option (evaluation backend), else null.
<yesno question>:
  answer: boolean # true when the statement holds.
  probability: number # Probability that it holds.
  confidence: number # Probability of the given answer.
<score question>:
  level: string # The most likely level.
  index: number # Its position, from 0.
  score: number # Fractional position on the scale (evaluation backend).
  confidence: number # 0 to 1.
  probabilities: object # Probability per level (evaluation backend), else null.
usage: object # Token usage ({ inputTokens, outputTokens, totalTokens }).
```

An answer outside its question's terms (an option or level the question does not have, a yes/no that is not true or false, or no answer at all) comes back with every field `null`, its confidence included. `_lt` compares `null` below any number, so a confidence gate such as `_lt: [{ _step: triage.team.confidence }, 0.7]` holds it back like a low-confidence answer, and a branch on the choice matches none of the options.

#### Examples

###### Route a support ticket, and queue uncertain ones for a person:

```yaml
api:
  - id: triage-ticket
    type: Api
    routine:
      - id: triage
        type: Decide
        connectionId: gateway
        properties:
          model: typesafe-ai/jev
          state:
            subject:
              _payload: subject
            body:
              _payload: body
          questions:
            team:
              choice: Which team handles this ticket
              options:
                billing: Invoices, charges and refunds
                tech: Outages and bugs
                sales: Plans and quotes
            down:
              yesno: The customer says the service is down
          providerOptions:
            gateway:
              zeroDataRetention: true
      - ':if':
          _lt:
            - _step: triage.team.confidence
            - 0.7
        ':then':
          - id: queue_review
            type: MongoDBInsertOne
            connectionId: review_queue
            properties:
              doc:
                subject:
                  _payload: subject
                suggested_team:
                  _step: triage.team.choice
          - ':return':
              status: review
      - ':if':
          _eq:
            - _step: triage.team.choice
            - billing
        ':then':
          - id: open_billing_case
            type: CallApi
            properties:
              endpointId: open-billing-case
      - ':return':
          team:
            _step: triage.team.choice
          urgent:
            _step: triage.down.answer
```

###### The same decision with any language model:

```yaml
requests:
  - id: rate_review
    type: Decide
    connectionId: claude
    payload:
      review:
        _state: review_text
    properties:
      model: claude-haiku-4-5
      state:
        _payload: review
      questions:
        sentiment:
          score: How positive is this review
          levels:
            - Very negative
            - Negative
            - Neutral
            - Positive
            - Very positive
```
