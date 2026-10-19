# _agent

```
(key: 'id' | 'conversationId'): string | null
(key: 'files'): { key: string, filename: string, mediaType: string }[] | null
(all: boolean): { id: string, conversationId: string | null, files: object[] } | null
(arguments: {
  all?: boolean,
  key?: 'id' | 'conversationId' | 'files',
  default?: any,
}): any
```

The `_agent` operator returns the [agent](/agents-introduction) that called the endpoint. Use it in an [endpoint tool](/agent-endpoint-tools) to tell agent work apart from a person's, for example to record who made a change.

- `_agent: id` returns the agent's `id` in the `agents` section.
- `_agent: conversationId` returns the id of the chat conversation the agent runs in. It is `null` for an agent run by a [`CallAgent`](/api) routine step, which has no conversation.
- `_agent: files` returns the files the person attached in the chat, as `[{ key, filename, mediaType }]`: every file the [`AgentChat`](/AgentChat) block uploaded to storage, from every message of the conversation the chat request carried, in message order. `key` is the file's storage key. Files pasted inline (no upload policy) have no key and are left out. It is `[]` for an agent run by a `CallAgent` step.
- `_agent: true` returns all three as `{ id, conversationId, files }`.

The model sees each attached file with its name (`Attached file: screenshot.png`), so it can pass the name to a tool. Have the tool take file names and look each one up in `_agent: files`, never a storage key from the tool's input: the model can then only reach files of its own conversation. The files come from the person's own chat request, so the browser decides what they hold; before reading one, check that its key is one the caller may read, for example that it starts with the prefix the upload policy gives the caller's uploads.

The value is set by Lowdefy when an agent calls the endpoint as a tool or a hook. Endpoints that endpoint calls in turn, through a `CallApi` step (including a `detached` one) or a connection's `callApi`, see the same agent. Nothing in the tool's payload or the chat request can set or change it, so the model cannot claim to be another agent or hide that it made the call.

On any call that did not come from an agent (a page request or `CallAPI` action, an MCP tool call, a scheduled or webhook run), `_agent` returns `null`, and reading a key returns `null` or the `default` when one is given. It never throws.

Tools that a sub-agent calls see the agent the chat or `CallAgent` step runs, not the sub-agent.

#### Arguments

###### string
The field of the calling agent to return: `id`, `conversationId` or `files`.

###### boolean
If `true`, returns the calling agent as `{ id, conversationId, files }`, or `null` when no agent called the endpoint.

###### object
  - `key: string`: The field to return, `id`, `conversationId` or `files`.
  - `default: any`: A value to return when no agent called the endpoint.
  - `all: boolean`: If `true`, returns the calling agent as `{ id, conversationId, files }`.

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

###### Attach a file from the chat by its name:
```yaml
api:
  - id: attach-chat-file
    type: Api
    description: Attach a file from this chat to a ticket. Pass the file's name as it was attached.
    payloadSchema:
      type: object
      properties:
        ticketId:
          type: string
        filename:
          type: string
    routine:
      - :set_state:
          file:
            _array.find:
              on:
                _agent:
                  key: files
                  default: []
              callback:
                _function:
                  __eq:
                    - __args: 0.filename
                    - _payload: filename
      - :if:
          _not:
            _string.startsWith:
              - _if_none:
                  - _state: file.key
                  - ''
              - _string.concat:
                  - uploads/
                  - _user: id
                  - /
        :then:
          - :reject: No file of yours by that name in this chat.
      - id: attach
        type: MongoDBUpdateOne
        connectionId: tickets
        properties:
          filter:
            _id:
              _payload: ticketId
          update:
            $push:
              files:
                key:
                  _state: file.key
                filename:
                  _state: file.filename
                mediaType:
                  _state: file.mediaType
```
The model names the file; the key comes from the chat request, and the endpoint checks that it is one of the caller's uploads.

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
