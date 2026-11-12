# McpSendMessage

```
(params: {
  text: string,
}): void
```

The `McpSendMessage` action sends a message to the MCP host, such as Claude, that the page is shown in as the view of an MCP tool. The message arrives in the conversation as if the person had typed it.

The action fails when the host refuses the message, so its `catch` actions run. It also fails when the page is not inside an MCP host. Use [`_mcp: embedded`](/_mcp) to show the button that runs it, or to `skip` the action, when the page is also used in the browser.

#### Parameters

###### object
  - `text: string`: __Required__ - The text of the message to send.

#### Examples

###### Ask the host about the record the page shows:
```yaml
- id: ask_button
  type: Button
  visible:
    _eq:
      - _mcp: embedded
      - true
  properties:
    title: Summarise this ticket
  events:
    onClick:
      - id: ask
        type: McpSendMessage
        params:
          text:
            _string.concat:
              - 'Summarise ticket '
              - _path_params: ticket_id
```

###### Tell the person when the host refuses the message:
```yaml
events:
  onClick:
    try:
      - id: send
        type: McpSendMessage
        params:
          text: Show my open tickets
    catch:
      - id: failed
        type: DisplayMessage
        params:
          status: warning
          content: The message could not be sent.
```
