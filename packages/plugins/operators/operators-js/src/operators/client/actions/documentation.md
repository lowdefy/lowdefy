<TITLE>
_actions
<TITLE>

<METADATA>
env: Client Only
</METADATA>

<DESCRIPTION>

The `_actions` operator returns the response value for a preceding action in the same event list.

The action response object has the following structure:

```yaml
error: Error,
index: number,
response: any,
skipped: boolean,
type: string,
```

<DESCRIPTION>
<USAGE>

```

(key: string): any
(all: boolean): any
(arguments: {
  all?: boolean,
  key?: string,
  default?: any,
}): any

###### string
If the `_actions` operator is called with a string equal to a preceding action id in the same event list, the action response object returned. If a string is passed which does not match preceding action id in the same event list, `null` is returned. Dot notation is supported.

###### boolean
If the `_actions` operator is called with boolean argument `true`, an object with all the preceding action id responses in the same event list is returned.
```

</USAGE>

<EXAMPLES>

### Using a action response:

```yaml
_actions: my_action.response
```

Returns: The response returned by the action.

### Setting a action response to `state`:

```yaml
id: refresh
type: Button
events:
  onClick:
    - id: get_fresh_data
      type: Request
      skip:
        _state: should_not_fetch
      params: get_data
    - id: set_data
      type: SetState
      params:
        did_not_fetch_data:
          _actions: get_fresh_data.skipped
```

</EXAMPLES>
