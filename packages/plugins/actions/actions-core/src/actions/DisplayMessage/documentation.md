<TITLE>
DisplayMessage
<TITLE>

<DESCRIPTION>
The `DisplayMessage` action is used to display a message to a user.
<DESCRIPTION>

<USAGE>
```
(params: {
  status?: enum,
  duration?: number,
  content?: string,
}): void
```

### object
- `status: enum`: DisplayMessage status type. Defaults to `success`. One of:
  - `success`
  - `error`
  - `info`
  - `warning`
  - `loading`.
- `duration: number`: Time in seconds before message disappears. The default is 5.
- `content: string`: The content of the message.
</USAGE>

<EXAMPLES>
### Display a success message:
```yaml
- id: success_message
  type: DisplayMessage
  params:
    content: Success
```

### Display an info message that remains visible for 10 seconds:
```yaml
- id: info_message
  type: DisplayMessage
  params:
    content: Something happened
    status: info
    duration: 10
```

### Display an error message that never disappears:
```yaml
- id: error_message
  type: DisplayMessage
  params:
    content: Something bad happened
    status: error
    duration: 0
```
</EXAMPLES>
