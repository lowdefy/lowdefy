# Google

The Google connection connects to the [Google Gemini API](https://ai.google.dev/docs) and provides the `GeminiAgent` agent type for use with [Lowdefy agents](/agents-introduction).

> The Google connection is provided by the `@lowdefy/connection-google` package, which is included by default.

## Connections

### Google

#### Properties
- `apiKey: string`: __Required__ - Google API key. Use [`_secret`](/_secret) to reference this securely.
- `baseURL: string`: Optional base URL for the Google API.

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

All AI provider connections (`Anthropic`, `OpenAI`, `Google`, `AIGateway`) provide the same `GenerateText` and `GenerateObject` request types — the `connectionId` selects the provider. These make a single, one-shot model call and return the result. They can be used as page requests, or as steps in [API endpoint routines](/api) — useful for classify, extract, summarize, or decide steps where the surrounding logic stays in your routine.

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
