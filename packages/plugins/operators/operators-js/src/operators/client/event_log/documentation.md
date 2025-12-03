<TITLE>
_event_log
</TITLE>

<METADATA>
env: Client Only
</METADATA>

<DESCRIPTION>
The `_event_log` operator logs its input to the browser console and returns the value unchanged. This is a debugging tool that allows you to inspect values during operator evaluation without affecting the rest of your configuration.

Since the operator returns the value it receives, you can wrap any operator or value with `_event_log` to see its evaluated result in the browser's developer console. This is particularly useful for:

- Debugging complex operator chains
- Inspecting request responses
- Verifying state values during development
- Tracing data flow through your application

> **Note**: Remember to remove `_event_log` operators before deploying to production, as console logging can impact performance and expose internal data.
> </DESCRIPTION>

<SCHEMA>
```yaml
_event_log:
  type: any
  description: The value to log to the console and return unchanged.
  returns: any (the same value that was passed in)
```
</SCHEMA>

<EXAMPLES>

###### Example 1: Basic value logging

Log a simple value to see its contents in the console.

```yaml
id: debug_display
type: Paragraph
properties:
  content:
    _event_log:
      _state: user_settings
```

Logs the `user_settings` state to the console and displays it in the paragraph.

---

###### Example 2: Debugging request responses

Inspect the response from a request to verify its structure.

```yaml
id: data_display
type: Descriptions
properties:
  items:
    _array.map:
      - _event_log:
          _request: get_user_profile
      - _function:
          __item.label: '$.key'
          __item.value: '$.value'
```

Logs the full request response to help understand the data structure.

---

###### Example 3: Tracing operator chain evaluation

Debug a complex chain of operators to find issues.

```yaml
id: calculated_field
type: Statistic
properties:
  title: Total Value
  value:
    _event_log:
      _sum:
        - _event_log:
            _array.map:
              - _request: get_line_items
              - _function:
                  __product:
                    - __args.0.price
                    - __args.0.quantity
        - _state: additional_fees
```

Logs both the mapped array of prices and the final sum for debugging.

---

###### Example 4: Debugging conditional logic

Verify that conditions are evaluating as expected.

```yaml
id: conditional_content
type: Box
visible:
  _event_log:
    _and:
      - _event_log:
          _user: roles
      - _event_log:
          _array.includes:
            - _user: roles
            - admin
      - _event_log:
          _eq:
            - _state: feature_enabled
            - true
blocks:
  - id: admin_panel
    type: Card
    properties:
      title: Admin Controls
```

Logs each condition separately to identify which one is failing.

---

###### Example 5: Debugging event handlers and action chains

Trace data through event handlers to debug complex workflows.

```yaml
id: submit_form
type: Button
properties:
  title: Submit
events:
  onClick:
    - id: validate_form
      type: Validate
    - id: prepare_data
      type: SetState
      params:
        submission_data:
          _event_log:
            form_values:
              _state: form
            calculated_fields:
              total:
                _sum:
                  _array.map:
                    - _state: form.items
                    - _function: __args.0.amount
            metadata:
              submitted_at:
                _date: now
              submitted_by:
                _user: id
    - id: submit_request
      type: Request
      params:
        data:
          _event_log:
            _state: submission_data
    - id: log_result
      type: SetState
      params:
        last_submission_result:
          _event_log:
            _actions: submit_request
```

Logs data at multiple points in the action chain to trace the full workflow.

</EXAMPLES>
