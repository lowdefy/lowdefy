Lowdefy APIs allow you to create custom server-side API endpoints within your Lowdefy application. These endpoints can execute complex server-side logic, orchestrate multiple database or external API calls, perform data transformations, and implement business workflows that require server-side processing.

APIs are particularly useful when you need to:

- Coordinate multiple requests in a specific sequence.
- Implement complex business logic that should run on the server.
- Transform or aggregate data from multiple sources.
- Create reusable endpoints that can be called from multiple pages.
- Build webhook endpoints for external services.
- Keep sensitive operations and data on the server.

## How Lowdefy APIs Work

Lowdefy APIs are defined at the root level of your configuration, similar to connections and pages. Each API endpoint consists of a `routine` i.e. a sequence of steps and control structures that define the execution flow. When an API endpoint is called from the client using the [`CallAPI`](/CallAPI) action, the routine executes on the server with access to connections, secrets, and server-side operators.

The API execution flow:

1. Client calls the API endpoint using the [`CallAPI`](/CallAPI) action with an optional payload.
2. Server checks authorization based on the auth configuration in `lowdefy.yaml`.
3. The endpoint routine executes sequentially (or in parallel where specified).
4. Each step can make requests to connections, transform data, or control flow.
5. The endpoint returns a response to the client.

## API Endpoint Definition

API endpoints are defined in the `api` array at the root of your Lowdefy configuration. Each endpoint should have an `id` that is unique among all API endpoints in the app. The `endpointId` is used by the [`CallAPI`](/CallAPI) action to specify which endpoint to execute.

The schema for a Lowdefy API is:

- `id: string`: **Required** - A unique identifier for the API endpoint.
- `type: Api`: **Required** - The API type.
- `routine: array/object`: **Required** - The routine to execute. **Operators are evaluated**.

###### API definition example:

```yaml
lowdefy: '{{ version }}'

connections:
  - id: users
    type: MongoDBCollection
    properties:
      collection: users
      databaseUri:
        _secret: MONGODB_URI

api:
  - id: get_user_data
    type: Api
    routine:
      - id: fetch_user
        type: MongoDBFindOne
        connectionId: users
        properties:
          query:
            user_id:
              _payload: user_id
      - :return:
          _step: fetch_user

pages:
  # ... your pages
```

## Authentication and Authorization

Lowdefy APIs use the same [authorization configuration](/protected-pages-apis) as pages. By default, API endpoints are public (accessible without authentication), just like pages. Authorization is configured in the `auth.api` section of the `lowdefy.yaml` file.

Unlike requests which are defined on a specific page and inherit the authorization of the page they are defined on, API endpoints can be called from any page in the app. Thus they do not inherit the authorization of the page they are called from, and authorization should be configured separately.

```yaml
lowdefy: '{{ version }}'

auth:
  # Configure which APIs require authentication
  api:
    protected: true
    public:
      - health_check
    roles:
      admin:
        - admin_api
        - manage_users
      manager:
        - manager_reports
        - team_data

api:
  # Your API definitions
  # ...
```

## Routines

Routines define the execution logic of your API endpoint. Routines are defined as a nested combination of routines (subroutines). A routine can be one of:

- **Request**: A Lowdefy request definition.
- **Control**: A control structure, which often contain nested subroutines.
- **Array of Subroutines**: An array of subroutines to execute sequentially.

### Requests

[Requests and connections](/connections-and-requests) can be used in API endpoints. Requests use the same connections defined in the `connections` section of the `lowdefy.yaml` file.

The `payload` property should not be defined for requests used in an API endpoint, the payload is specified by the [CallAPI](/CallAPI) action.

A single request definition is a valid routine definition.

```yaml
id: log_message
type: Api
routine:
  id: insert_log_message
  type: MongoDBInsertOne
  connectionId: logs
  properties:
    message:
      _payload: message
    doc:
      timestamp:
        _date: now
```

### Arrays of Subroutines

Subroutines in an array execute one after another:

```yaml
id: my_endpoint
type: Api
routine:
  - id: step_1
    type: MongoDBFindOne
    connectionId: users
    properties:
      query:
        _id:
          _payload: user_id

  - id: step_2
    type: MongoDBInsertOne
    connectionId: audit-log
    properties:
      doc:
        user_id:
          _step: step_1._id
        action: 'user_viewed'
        timestamp:
          _date: now

  - :return:
      user:
        _step: step_1
      logged: true
```

Arrays can also be nested. This is useful when referencing shared subroutines that might be an array

```yaml
# my_endpoint.yaml
id: my_endpoint
type: Api
routine:
  - _ref: shared_routine.yaml
  - :return:
      user:
        _step: step_1
      logged: true
```

```yaml
# shared_routine.yaml
- id: step_1
  type: MongoDBFindOne
  connectionId: users
  properties:
    query:
      _id:
        _payload: user_id

- id: step_2
  type: MongoDBInsertOne
  connectionId: audit-log
  properties:
    doc:
      user_id:
        _step: step_1._id
      action: 'user_viewed'
      timestamp:
        _date: now
```

### Control Structures

Control structures allow you to implement complex logic flows within your API routines. The following controls can be used in API routines:

- [`:for`](/for) - Iterate over an array sequentially.
- [`:if`](/if) - Execute different routines based on a condition.
- [`:log`](/log) - Output messages to the server console.
- [`:parallel`](/parallel) - Execute multiple routines simultaneously.
- [`:parallel_for`](/parallel_for) - Iterate over an array with concurrent processing.
- [`:reject`](/reject) - Return a user-facing error response.
- [`:return`](/return) - Return a successful response with data.
- [`:set_state`](/set_state) - Set values in server-side state.
- [`:switch`](/switch) - Handle multiple conditions with different outcomes.
- [`:throw`](/throw) - Throw a system error that can be caught.
- [`:try`](/try) - Handle errors with catch and finally blocks.

## Operators

The following operators are specific to API endpoints:

- [`_item`](/_item) - Access current item in :for and :parallel_for loops.
- [`_state`](/_state) - Access server-side state set with :set_state.
- [`_step`](/_step) - Access results from requests in previous steps.

API endpoints also have access to all operators available on the server, including:

- [`_payload`](/_payload) - Access the payload sent from the client.
- [`_secret`](/_secret) - Access secrets from environment variables or secrets configuration.
- [`_user`](/_user) - Access authenticated user information.

### Accessing Step Results

Use the [`_step`](/_step) operator to access results from previously executed steps:

```yaml
- id: get_user
  type: MongoDBFindOne
  connectionId: users
  properties:
    query:
      email:
        _payload: email

- id: get_orders
  type: MongoDBAggregation
  connectionId: orders
  properties:
    pipeline:
      - $match:
          user_id:
            _step: get_user._id # Access the _id from the get_user request
```

## CallAPI Action

Use the `CallAPI` action to call your API endpoints from pages. Read more about the `CallAPI` action [here](/CallAPI).

###### Basic example:

```yaml
blocks:
  - id: user_id_input
    type: TextInput
    properties:
      title: User ID

  - id: fetch_user_btn
    type: Button
    properties:
      title: Fetch User Data
    events:
      onClick:
        - id: call_user_api
          type: CallAPI
          params:
            endpoint_id: get_user_data
            payload:
              user_id:
                _state: user_id_input

        - id: set_user_data
          type: SetState
          params:
            user_data:
              _actions: call_user_api.response.user

  - id: user_display
    type: Descriptions
    properties:
      items:
        _state: user_data
```

###### Error handling example:

```yaml
events:
  onClick:
    try:
      - id: call_process_data_api
        type: CallAPI
        params:
          endpoint_id: process_data
          payload:
            data:
              _state: form_data

      - id: show_success
        type: DisplayMessage
        params:
          content: 'Data processed successfully!'
          status: success

      - id: update_state
        type: SetState
        params:
          result:
            _actions: call_process_data_api.response

    catch:
      - id: update_state
        type: SetState
        params:
          error_message:
            _actions: call_process_data_api.error.message
```

### \_api Operator

The [`_api`](/_api) operator returns the response value of an API call. If the API has not yet been called, or is still executing, the returned value is `null`.

###### Using an API response:

```yaml
blocks:
  - id: loading_text
    type: Html
    visible:
      _api: fetch_data.loading
    properties:
      html: '<div class="secondary">Loading...</div>'

  - id: error_alert
    type: Alert
    visible:
      _not:
        _api: fetch_data.success
    properties:
      type: error
      message:
        _api: fetch_data.error.message

  - id: data_display
    type: Descriptions
    properties:
      items:
        _api: fetch_data.response
```

## Complex Example: Order Processing API

Here's a comprehensive example showing various features:

```yaml
lowdefy: '{{ version }}'
auth:
  api:
    protected: true
    roles:
      user:
        - process_order

api:
  - id: process_order
    type: Api
    routine:
      # Validate order
      - id: validate_order
        type: MongoDBFindOne
        connectionId: orders
        properties:
          query:
            _id:
              _payload: order_id
            status: 'pending'
            user_id:
              _user: id # Ensure user owns this order

      - :if:
          _not:
            _step: validate_order
        :then:
          :reject: 'Order not found or already processed'

      # Process items in parallel
      - :parallel_for: item
        :in:
          _step: validate_order.items
        :do:
          - id: check_inventory
            type: MongoDBFindOne
            connectionId: products
            properties:
              query:
                _id:
                  _item: item.product_id
                inventory:
                  $gte:
                    _item: item.quantity

          - :if:
              _not:
                _step: check_inventory
            :then:
              :throw: 'Insufficient inventory'

      # Try payment processing
      - :try:
          - id: process_payment
            type: AxiosHttp
            connectionId: payment-gateway
            properties:
              data:
                amount:
                  _step: validate_order.total
                currency: 'USD'
                source:
                  _payload: payment_token

        :catch:
          - id: mark_payment_failed
            type: MongoDBUpdateOne
            connectionId: orders
            properties:
              filter:
                _id:
                  _payload: order_id
              update:
                $set:
                  status: 'payment_failed'
                  failed_at:
                    _date: now

          - :reject: 'Payment processing failed'

      # Update order status
      - id: complete_order
        type: MongoDBUpdateOne
        connectionId: orders
        properties:
          filter:
            _id:
              _payload: order_id
          update:
            $set:
              status: 'completed'
              payment_id:
                _step: process_payment.data.id
              completed_at:
                _date: now

      # Update inventory
      - :for: item
        :in:
          _step: validate_order.items
        :do:
          - id: reduce_inventory
            type: MongoDBUpdateOne
            connectionId: products
            properties:
              filter:
                _id:
                  _item: item.product_id
              update:
                $inc:
                  inventory: -1

      # Send confirmation email
      - id: send_confirmation
        type: SendGridMail
        connectionId: email-service
        properties:
          to:
            _step: validate_order.customer_email
          template_id: 'order_confirmation'
          dynamic_template_data:
            order_id:
              _payload: order_id
            total:
              _step: validate_order.total

      # Return success
      - :return:
          success: true
          order_id:
            _payload: order_id
          payment_id:
            _step: process_payment.data.id
          message: 'Order processed successfully'
```

### TLDR

- Lowdefy APIs create custom server-side endpoints that execute complex logic.
- Routines define the execution flow using arrays, requests and control structures.
- Control structures like [`:if`](/:if), [`:for`](/:for), [`:parallel`](/:parallel), and [`:try`](/:try) enable sophisticated flows.
- Requests make requests to connections and can access results using [`_step`](/_step).
- The [`CallAPI`](/CallAPI) action is used to invoke APIs from the client with payloads.
- Server-side execution provides access to secrets, connections, and server operators.
- Responses are controlled with [`:return`](/:return) (success) and [`:reject`](/:reject) (user errors).
