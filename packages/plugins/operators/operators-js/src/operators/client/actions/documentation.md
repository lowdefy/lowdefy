<TITLE>
_actions
</TITLE>

<METADATA>
env: Client Only
</METADATA>

<DESCRIPTION>
The `_actions` operator retrieves the response value from a preceding action in the same event action chain. This allows you to access results from earlier actions such as API calls, requests, or other operations to use in subsequent actions.

The action response object has the following structure:

```yaml
error: Error # Any error that occurred during action execution
index: number # The index of the action in the event chain
response: any # The data returned by the action
skipped: boolean # Whether the action was skipped due to a skip condition
type: string # The action type (e.g., 'Request', 'SetState')
```

</DESCRIPTION>

<SCHEMA>
```yaml
_actions:
  type: string | boolean | object
  description: Access action responses from the current event chain.
  oneOf:
    - type: string
      description: The action id to get the response from. Dot notation supported.
    - type: boolean
      description: If true, returns all action responses as an object.
    - type: object
      properties:
        key:
          type: string
          description: The action id to retrieve. Dot notation supported.
        all:
          type: boolean
          description: If true, returns all action responses.
        default:
          type: any
          description: Value to return if the action response is not found.
```
</SCHEMA>

<EXAMPLES>

###### Example 1: Basic action response access

Access the response from a preceding request action.

```yaml
id: save_button
type: Button
properties:
  title: Save Record
events:
  onClick:
    - id: save_record
      type: Request
      params: insert_new_record
    - id: show_success
      type: Message
      params:
        content:
          _string.concat:
            - 'Record saved with ID: '
            - _actions: save_record.response.insertedId
```

---

###### Example 2: Checking if an action was skipped

Use the `skipped` property to conditionally execute follow-up actions.

```yaml
id: refresh_button
type: Button
properties:
  title: Refresh Data
events:
  onClick:
    - id: fetch_latest_data
      type: Request
      skip:
        _state: offline_mode
      params: get_current_data
    - id: update_display
      type: SetState
      skip:
        _actions: fetch_latest_data.skipped
      params:
        current_data:
          _actions: fetch_latest_data.response
    - id: notify_offline
      type: Message
      skip:
        _not:
          _actions: fetch_latest_data.skipped
      params:
        content: 'Currently offline - using cached data'
        duration: 3
```

---

###### Example 3: Chaining multiple API calls with action results

Use the response from one action as input for another.

```yaml
id: process_order_button
type: Button
properties:
  title: Process Order
events:
  onClick:
    - id: validate_inventory
      type: Request
      params: check_stock_levels
    - id: create_order
      type: Request
      skip:
        _not:
          _actions: validate_inventory.response.in_stock
      params:
        order_data:
          _state: order_form
        stock_data:
          _actions: validate_inventory.response
    - id: send_confirmation
      type: Request
      skip:
        _actions: create_order.skipped
      params:
        order_id:
          _actions: create_order.response._id
        customer_email:
          _state: order_form.email
    - id: update_state
      type: SetState
      params:
        order_confirmed: true
        order_id:
          _actions: create_order.response._id
        confirmation_sent:
          _not:
            _actions: send_confirmation.skipped
```

---

###### Example 4: Error handling with action responses

Check for errors and handle them appropriately.

```yaml
id: submit_form
type: Button
properties:
  title: Submit
events:
  onClick:
    - id: submit_data
      type: Request
      params: submit_form_data
    - id: handle_success
      type: SetState
      skip:
        _actions: submit_data.error
      params:
        form_submitted: true
        submission_id:
          _actions: submit_data.response._id
    - id: handle_error
      type: Message
      skip:
        _not:
          _actions: submit_data.error
      params:
        content:
          _string.concat:
            - 'Submission failed: '
            - _actions: submit_data.error.message
        type: error
        duration: 5
    - id: log_attempt
      type: SetState
      params:
        last_submission_attempt:
          success:
            _not:
              _actions: submit_data.error
          timestamp:
            _date: now
          action_index:
            _actions: submit_data.index
```

---

###### Example 5: Accessing all action responses for debugging

Retrieve all action responses to log or process them together.

```yaml
id: complex_workflow
type: Button
properties:
  title: Run Workflow
events:
  onClick:
    - id: step_one
      type: Request
      params: initialize_workflow
    - id: step_two
      type: Request
      params:
        workflow_id:
          _actions: step_one.response.workflow_id
    - id: step_three
      type: Request
      params:
        data:
          _actions: step_two.response.processed_data
    - id: store_workflow_log
      type: SetState
      params:
        workflow_completed: true
        workflow_log:
          _actions: true # Returns all action responses
    - id: send_audit
      type: Request
      params:
        all_responses:
          _actions:
            all: true
        workflow_summary:
          step_one_success:
            _not:
              _actions: step_one.skipped
          step_two_success:
            _not:
              _actions: step_two.skipped
          step_three_success:
            _not:
              _actions: step_three.skipped
```

</EXAMPLES>
