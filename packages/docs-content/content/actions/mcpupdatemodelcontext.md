# McpUpdateModelContext

```
(params: {
  text: string,
}): void
```

The `McpUpdateModelContext` action tells the model in an MCP host, such as Claude, what the person did on the page the host shows as the view of an MCP tool. It posts no message and the host does not reply: the model reads the text on its next turn.

Each call replaces the text the page set before, so send the whole picture the model needs, not only the latest change. The host may hold the text until the person's next message.

Use it after a save or another change the model should know about. To ask the host something, so that it replies, use [`McpSendMessage`](/McpSendMessage).

The action fails when the host refuses the context, so its `catch` actions run. It also fails when the page is not inside an MCP host. Use [`_mcp: embedded`](/_mcp) to `skip` the action when the page is also used in the browser.

#### Parameters

###### object
  - `text: string`: __Required__ - The context for the model, such as what the person changed.

#### Examples

###### Tell the model what the person saved:
```yaml
- id: save_button
  type: Button
  properties:
    title: Save
  events:
    onClick:
      - id: save
        type: Request
        params: update_step
      - id: tell_model
        type: McpUpdateModelContext
        skip:
          _ne:
            - _mcp: embedded
            - true
        params:
          text:
            _string.concat:
              - 'The person saved the steps of this sequence. They are now: '
              - _json.stringify:
                  - _state: steps
```
The text holds every step, not only the one that changed, since it replaces what the page sent before. In the browser `_mcp: embedded` is `null`, so the action is skipped.

###### Tell the person when the host refuses the context:
```yaml
events:
  onChange:
    try:
      - id: tell_model
        type: McpUpdateModelContext
        params:
          text:
            _string.concat:
              - 'The person is looking at the steps of sequence '
              - _url_query: sequence
              - '.'
    catch:
      - id: failed
        type: DisplayMessage
        params:
          status: warning
          content: Claude could not be told about this change.
```
