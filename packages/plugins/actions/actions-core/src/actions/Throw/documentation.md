<TITLE>
Throw
<TITLE>

<DESCRIPTION>
The `Throw` action is used throw an error to the user and log to the console. If `throw: true`, the `Throw`
action will throw an error, and this will stop the execution of actions that are defined after it. If the action does not thrown, the `Throw` action will do nothing and the actions defined after it will be executed.
<DESCRIPTION>

<USAGE>
```
(params: {
  throw?: boolean,
  message?: string,
  metaData?: any
}): void
```

- `throw: boolean`: Throws an error and stops the action chain when `true` or continues the action chain when `false` or undefined.
- `message: string`: The error message to show to the user and log to the console if `throw: true`. This message can be overridden by setting the action's `messages.error`.
- `metaData: any`: Data to log to the console if `throw: true`.
</USAGE>

<EXAMPLES>
### Throw with custom message:
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

### Throw with metaData:
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

### Override custom message:
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

### Fail silently:
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
</EXAMPLES>
