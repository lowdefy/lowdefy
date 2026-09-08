# Endpoint Tools

Endpoint tools connect your agent to your app's [API endpoints](/lowdefy-api). The model can call these tools during a conversation to query databases, call external APIs, create records, or any other server-side operation your endpoints support.

If you are not familiar with the Lowdefy API system, see the [APIs](/lowdefy-api) concept page first.

## Defining a Tool Endpoint

Any endpoint defined in the `api` section can be used as a tool, as long as it has a `description` and a `payloadSchema`. The description tells the model what the tool does, and the payload schema defines the input format.

> Well-written `description` and `payloadSchema.properties.*.description` fields are critical — they are all the model has to decide when to call the tool and what arguments to pass.

###### Search endpoint:
```yaml
api:
  - id: search-articles
    type: Api
    description: >
      Search knowledge base articles by topic. Returns matching
      articles with title, summary, and content.
    payloadSchema:
      type: object
      properties:
        query:
          type: string
          description: Search term — can be a topic, keyword, or question.
        limit:
          type: integer
          description: Maximum number of articles to return.
          default: 5
      required:
        - query
    routine:
      - id: search
        type: MongoDBFind
        connectionId: kb_db
        properties:
          collection: articles
          query:
            $text:
              $search:
                _payload: query
          options:
            projection:
              title: 1
              summary: 1
              content: 1
              score:
                $meta: textScore
            sort:
              score:
                $meta: textScore
            limit:
              _payload: limit
      - :return:
          _step: search
```

###### Create endpoint:
```yaml
api:
  - id: create-support-ticket
    type: Api
    description: >
      Create a support ticket for issues that need human follow-up.
      Returns the ticket number.
    payloadSchema:
      type: object
      properties:
        subject:
          type: string
          description: Short summary of the issue.
        description:
          type: string
          description: Detailed description of the problem.
        priority:
          type: string
          enum:
            - low
            - medium
            - high
          description: Ticket priority level.
      required:
        - subject
        - description
    routine:
      - id: insert
        type: MongoDBInsertOne
        connectionId: tickets_db
        properties:
          doc:
            subject:
              _payload: subject
            description:
              _payload: description
            priority:
              _payload: priority
            status: open
            createdAt:
              _date: now
            userId:
              _user: id
      - :return:
          ticketId:
            _step: insert.insertedId
```

###### HTTP API call:
```yaml
api:
  - id: get-weather
    type: Api
    description: >
      Get current weather for a city. Returns temperature,
      conditions, and forecast.
    payloadSchema:
      type: object
      properties:
        city:
          type: string
          description: City name (e.g. "London", "New York").
      required:
        - city
    routine:
      - id: fetch
        type: AxiosHttp
        connectionId: weather_api
        properties:
          url:
            _string.concat:
              - /current?city=
              - _payload: city
      - :return:
          _step: fetch.data
```

## Referencing Tools in an Agent

Reference tools in the agent's `tools` array using a string shorthand or an object:

- `tools: array`: Each item is either:
  - `string` — The endpoint `id`.
  - `object`:
    - `endpointId: string`: __Required__ - The endpoint `id`.
    - `confirm: boolean`: When `true`, the user must approve the call before it executes.

```yaml
agents:
  - id: support_agent
    type: ClaudeAgent
    connectionId: anthropic
    properties:
      model: claude-sonnet-4-20250514
      instructions: |
        You are a support agent. Search the knowledge base before
        answering. If you can't resolve the issue, create a ticket.
    tools:
      # String shorthand
      - search-articles
      # Object form with confirmation
      - endpointId: create-support-ticket
        confirm: true
```

## Reserved Tool Names

Lowdefy registers a small set of platform tools automatically (for example, `update-page-state`, which the [`AgentChat`](/AgentChat#shared-state) block wires up when `sharedState` is set). The following tool names are reserved and cannot be used as endpoint ids or sub-agent ids — the build will fail if one is encountered:

- `update-page-state`
- `read-file`
- `list-files`
- `search-files`
- `stat-file`

## Tool Confirmation

Setting `confirm: true` pauses the agent loop and shows approve/reject buttons in the [`AgentChat`](/AgentChat) block. The agent waits until the user responds before continuing.

Use confirmation for destructive or sensitive operations — deleting records, sending emails, making payments, etc.

```yaml
tools:
  - search-articles
  - endpointId: create-support-ticket
    confirm: true
  - endpointId: send-email
    confirm: true
  - endpointId: delete-record
    confirm: true
```
