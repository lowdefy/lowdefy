# CallMethod

```
(params: {
  blockId: string,
  method: string,
  args?: any[]
}): void
```

The `CallMethod` action is used to call a method defined by another block.

#### Parameters

###### object
  - `blockId: string`: __Required__ - The id of the block.
  - `method: string`: __Required__ - The name of the method that should be called.
  - `args: any[]`: The array of positional arguments with which the method should be called.

#### Examples

###### Open a modal:
```yaml
- id: toggle_modal
  type: CallMethod
  params:
    blockId: my_modal
    method: toggleOpen
```

###### Display a message with args:
```yaml
- id: display_message
  type: CallMethod
  params:
    blockId: my_message
    method: open
    args:
      - content: Hello
        duration: 4
```
