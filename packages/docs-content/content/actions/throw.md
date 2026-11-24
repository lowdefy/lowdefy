# Throw

```
(params: {
  throw?: boolean,
  message?: string,
  metaData?: any
}): void
```

The `Throw` action throws an error to show to the user and log to the browser console. If `throw: true`, the `Throw`
action throws an error, which stops the execution of the actions defined after it and runs the event's `catch` actions. If the action does not throw, the `Throw` action does nothing and the actions defined after it are executed.

A thrown `Throw` is an expected outcome, not an app fault: it is logged as a `UserError` to the browser console only, and is never reported to the server. It is always logged, even when the action's `messages.error` is `false` - that only hides the message.

To end an event early on purpose, without an error, use the [`:return`](/:return) control instead, usually inside an [`:if`](/:if). It ends the event successfully: nothing is logged, no message shows, the event's `catch` actions do not run, and the actions after it are skipped.

#### Parameters

- `throw: boolean`: Throws an error and stops the action chain when `true` or continues the action chain when `false` or undefined.
- `message: string`: The error message to show to the user and log to the console if `throw: true`. This message can be overridden by setting the action's `messages.error`.
- `metaData: any`: Data to log to the console if `throw: true`.

#### Examples

###### Throw with custom message:
```yaml
- id: foo_throw
  type: Throw
  params:
    throw:
      _eq:
        - _state: lukes_father
        - Darth Vader
    message: Nooooooooooooooooo
```

###### Throw with metaData:
```yaml
- id: foo_throw
  type: Throw
  params:
    throw:
      _eq:
        - _state: lukes_father
        - Darth Vader
    message: Nooooooooooooooooo
    metaData:
      realisation: Luke kissed his sister
```
###### Override custom message:
```yaml
- id: foo_throw
  type: Throw
  messages:
    error: Meh.
  params:
    throw:
      _eq:
        - _state: lukes_father
        - Darth Vader
    message: Nooooooooooooooooo
```
###### Throw without showing a message:
The error is still logged to the browser console and the event's `catch` actions still run.
```yaml
- id: foo_throw
  type: Throw
  messages:
    error: false
  params:
    throw:
      _eq:
        - _state: lukes_father
        - Darth Vader
    message: Nooooooooooooooooo
```
###### End the event early without an error:
Use the [`:return`](/:return) control, not `Throw`, to stop an event's actions on purpose. Nothing is logged and no message shows.
```yaml
- ':if':
    _eq:
      - _state: lukes_father
      - Darth Vader
  ':then':
    - ':return': null
- id: continue_training
  type: SetState
  params:
    training: jedi
```
