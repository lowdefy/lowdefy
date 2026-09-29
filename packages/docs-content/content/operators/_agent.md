# _agent

```
(key: 'id' | 'conversationId'): string | null
(all: boolean): { id: string, conversationId: string | null } | null
(arguments: {
  all?: boolean,
  key?: 'id' | 'conversationId',
  default?: any,
}): any
```

The `_agent` operator returns the [agent](/agents-introduction) that called the endpoint. Use it in an [endpoint tool](/agent-endpoint-tools) to tell agent work apart from a person's, for example to record who made a change.

- `_agent: id` returns the agent's `id` in the `agents` section.
- `_agent: conversationId` returns the id of the chat conversation the agent runs in. It is `null` for an agent run by a [`CallAgent`](/api) routine step, which has no conversation.
- `_agent: true` returns both as `{ id, conversationId }`.

The value is set by Lowdefy when an agent calls the endpoint as a tool or a hook. Endpoints that endpoint calls in turn, through a `CallApi` step (including a `detached` one) or a connection's `callApi`, see the same agent. Nothing in the tool's payload or the chat request can set or change it, so the model cannot claim to be another agent or hide that it made the call.

On any call that did not come from an agent (a page request or `CallAPI` action, an MCP tool call, a scheduled or webhook run), `_agent` returns `null`, and reading a key returns `null` or the `default` when one is given. It never throws.

Tools that a sub-agent calls see the agent the chat or `CallAgent` step runs, not the sub-agent.

#### Arguments

###### string
The field of the calling agent to return: `id` or `conversationId`.

###### boolean
If `true`, returns the calling agent as `{ id, conversationId }`, or `null` when no agent called the endpoint.

###### object
  - `key: string`: The field to return, `id` or `conversationId`.
  - `default: any`: A value to return when no agent called the endpoint.
  - `all: boolean`: If `true`, returns the calling agent as `{ id, conversationId }`.

#### Examples

###### Record whether an agent or a person made a change:
```yaml
api:
  - id: update-ticket
    type: Api
    description: Update a support ticket's status.
    payloadSchema:
      type: object
      properties:
        ticketId:
          type: string
        status:
          type: string
    routine:
      - id: update
        type: MongoDBUpdateOne
        connectionId: tickets
        properties:
          filter:
            _id:
              _payload: ticketId
          update:
            $set:
              status:
                _payload: status
              updated:
                userId:
                  _user: id
                agentId:
                  _agent: id
                conversationId:
                  _agent: conversationId
```
When the `support_agent` agent calls the endpoint from a chat, `agentId` is `support_agent` and `conversationId` is the chat's conversation id. When a person calls it from a page, both are `null`.

###### Branch on whether an agent called the endpoint:
```yaml
routine:
  - :if:
      _ne:
        - _agent: true
        - null
    :then:
      - :return:
          message: Changes made by agents are held for review.
```

###### Use a default when no agent called the endpoint:
```yaml
source:
  _agent:
    key: id
    default: person
```
Returns: The agent id, or `person` when a person called the endpoint.
