# OpenAI

The OpenAI connection connects to the [OpenAI API](https://platform.openai.com/docs/) and provides the `OpenAIAgent` agent type for use with [Lowdefy agents](/agents-introduction).

> The OpenAI connection is provided by the `@lowdefy/connection-openai` package, which is included by default.

## Connections

### OpenAI

#### Properties
- `apiKey: string`: __Required__ - OpenAI API key. Use [`_secret`](/_secret) to reference this securely.
- `baseURL: string`: Optional base URL. Use this to connect to Azure OpenAI or any OpenAI-compatible endpoint.

###### Connection example:
```yaml
connections:
  - id: openai
    type: OpenAI
    properties:
      apiKey:
        _secret: OPENAI_API_KEY
```

###### Azure OpenAI:
```yaml
connections:
  - id: azure_openai
    type: OpenAI
    properties:
      apiKey:
        _secret: AZURE_OPENAI_API_KEY
      baseURL: https://my-resource.openai.azure.com/openai/deployments/my-deployment
```

## Agent Types

### OpenAIAgent

The `OpenAIAgent` supports all [common agent properties](/agents-introduction) plus the following:

| Property | Type | Description |
| --- | --- | --- |
| `reasoningEffort` | string | Reasoning effort for reasoning models (o3, o4-mini): `'none'`, `'minimal'`, `'low'`, `'medium'`, `'high'`, or `'xhigh'`. |
| `reasoningSummary` | string | Reasoning summary mode: `'auto'` or `'detailed'`. |

> `reasoningEffort` and `reasoningSummary` only apply to OpenAI reasoning models (o3, o4-mini). They are ignored for standard models like gpt-4o.

###### Standard model:
```yaml
agents:
  - id: assistant
    type: OpenAIAgent
    connectionId: openai
    properties:
      model: gpt-4o
      instructions: |
        You are a helpful assistant for our internal tools.
        Search the documentation when users ask questions.
      maxSteps: 5
    tools:
      - search-docs
      - get-user-permissions
```

###### Reasoning model for complex analysis:
```yaml
agents:
  - id: code_reviewer
    type: OpenAIAgent
    connectionId: openai
    properties:
      model: o4-mini
      reasoningEffort: high
      reasoningSummary: detailed
      instructions: |
        You review code changes for bugs, security issues, and
        performance problems. Be thorough and specific.
    tools:
      - get-pull-request
      - get-file-contents
```

## Requests

Request types:

- GenerateText
- GenerateObject
- Decide

All AI provider connections (`Anthropic`, `OpenAI`, `Google`, `AIGateway`) provide the same `GenerateText`, `GenerateObject` and `Decide` request types — the `connectionId` selects the provider. These make a single, one-shot model call and return the result. They can be used as page requests, or as steps in [API endpoint routines](/api) — useful for classify, extract, summarize, or decide steps where the surrounding logic stays in your routine. For a closed-vocabulary decision — pick one of these options, yes or no, rate on this scale — use `Decide`.

For multi-step tool use, see [agents](/agents-introduction) instead.

### GenerateText

Generates text from a prompt.

#### Properties

- `model: string`: **Required** - Model id to generate with.
- `prompt: string`: Text prompt. Use either `prompt` or `messages`, not both.
- `messages: object[]`: Model messages (`{ role, content }`). Use either `prompt` or `messages`, not both.
- `system: string`: System prompt.
- `maxOutputTokens: number`: Maximum number of tokens to generate.
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
- `structured-output` — any language model, asked for the answers as schema-checked structured output. Available on every AI connection, and the default on `Anthropic`, `OpenAI` and `Google`. Its confidence is the model's own estimate, not a calibrated probability.

Keep the state to what the questions need: an evaluation model reads the state literally, and accuracy drops as it grows. A `Decide` is never a security boundary — text in the state can argue for its own answer.

#### Properties

- `model: string`: **Required** - Model id to decide with, e.g. `typesafe-ai/jev`. Pin a version wherever a confidence threshold is tuned — a `latest` alias changes answers on release.
- `state: string | object | array`: **Required** - What the questions are about.
- `questions: object`: **Required** - Named questions, answered together against the state. Each question id becomes a key of the response (`usage` is reserved). A question is one of:
  - `{ choice: string, options: object }` - Pick exactly one option. `options` maps option names (2 to 255) to what each one means (`null` for no description).
  - `{ yesno: string, criteria?: { yes: string, no: string } }` - Judge a statement true or false. `criteria` optionally says what counts as yes and as no.
  - `{ score: string, levels: string[] }` - Place the state on 2 to 10 ordered levels, lowest first.
- `backend: enum`: `evaluation` or `structured-output`. Defaults to `evaluation` on `AIGateway` and `structured-output` elsewhere.
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
