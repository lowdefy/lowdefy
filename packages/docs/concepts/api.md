Lowdefy APIs allow you to create custom server-side API endpoints within your Lowdefy application. These endpoints can execute complex server-side logic, orchestrate multiple database or external API calls, perform data transformations, and implement business workflows that require server-side processing.

APIs are particularly useful when you need to:
- Coordinate multiple requests in a specific sequence.
- Implement complex business logic that should run on the server.
- Transform or aggregate data from multiple sources.
- Create reusable endpoints that can be called from multiple pages.
- Build webhook endpoints for external services.
- Keep sensitive operations and data on the server.

## How Lowdefy APIs Work

Lowdefy APIs are defined at the root level of your configuration, similar to connections and pages. Each API endpoint consists of a **routine** - a sequence of steps and control structures that define the execution flow. When an API is called from the client using the `CallAPI` action, the routine executes on the server with access to connections, secrets, and server-side operators.

The API execution flow:
1. Client calls the API using the `CallAPI` action with an optional payload.
2. Server checks authorization based on the auth configuration in `lowdefy.yaml`.
3. The API routine executes sequentially (or in parallel where specified).
4. Each step can make requests to connections, transform data, or control flow.
5. The API returns a response to the client.

## API Definition

APIs are defined in the `api` array at the root of your Lowdefy configuration. Each API should have an `id` that is unique among all APIs in the app. When an API is called from the client using the `CallAPI` action, the `endpointId` parameter must match the API's `id`.

### API Schema

```yaml
api:
  - id: string        # Required - Unique identifier for the API endpoint
    type: string      # Required - The API type (typically 'Api')
    routine: array/object  # Required - The routine to execute
```

### Basic API Example

```yaml
lowdefy: 4.4.0

connections:
  - id: users
    type: MongoDB
    properties:
      uri:
        _secret: MONGODB_URI
      databaseName: my_app

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

Lowdefy APIs use the same authentication and authorization system as pages. By default, APIs are public (accessible without authentication), just like pages. Authorization is configured at the app level in your `lowdefy.yaml` file, not on individual API endpoints.

### Default Behavior

By default, all APIs are public and can be accessed without authentication:

```yaml
api:
  - id: public_api
    type: Api
    routine:
      - id: get_data
        type: MongoDBFind
        connectionId: content
        properties:
          query:
            published: true
      - :return:
          data:
            _step: get_data
```

### Global Auth Configuration

To protect APIs and require authentication, configure them in the `auth` section of your `lowdefy.yaml`:

```yaml
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
      user:
        - get_user_data
        - update_profile

# Your API definitions
api:
  - id: health_check
    type: Api
    routine:
      - :return:
          status: 'healthy'
          timestamp:
            _date: now

  - id: get_user_data
    type: Api
    routine:
      - id: fetch_user
        type: MongoDBFindOne
        connectionId: users
        properties:
          query:
            user_id:
              _user: id
      - :return:
          user:
            _step: fetch_user
```

### Protected APIs

To require authentication for specific APIs, list them under `protected` in your auth configuration:

```yaml
auth:
  api:
    protected:
      - user_profile_api
      - update_settings_api

api:
  - id: user_profile_api
    type: Api
    routine:
      - :return:
          message: 'This API requires authentication'
          user_id:
            _user: id
          email:
            _user: email
```

### Role-Based Access Control

For APIs that should only be accessible to users with specific roles, configure them under `roles`:

```yaml
auth:
  api:
    protected:
      - admin_dashboard_api
      - team_reports_api
      - profile_api
    roles:
      admin:
        - admin_dashboard_api
        - user_management_api
      manager:
        - team_reports_api
        - department_stats_api
      user:
        - profile_api

api:
  - id: admin_dashboard_api
    type: Api
    routine:
      - id: get_system_stats
        type: MongoDBAggregate
        connectionId: analytics
        properties:
          pipeline:
            - $group:
                _id: null
                total_users:
                  $sum: 1
      - :return:
          stats:
            _step: get_system_stats

  - id: profile_api
    type: Api
    routine:
      - id: get_profile
        type: MongoDBFindOne
        connectionId: users
        properties:
          query:
            user_id:
              _user: id  # Can only get own profile
      - :return:
          _step: get_profile
```

### Authorization Errors

When a user attempts to access an API they're not authorized for:
- Unauthenticated users trying to access protected APIs will receive an authentication error.
- Authenticated users without required roles will receive an authorization error.
- The API endpoint behaves the same as pages - appearing as if it doesn't exist to unauthorized users.

## Routines

Routines define the execution logic of your API. They can be either:

- **Arrays**: Steps execute sequentially
- **Objects**: Single step or control structure
- **Nested combinations**: Arrays and objects can be nested to create complex flows

### Sequential Execution

By default, steps in an array execute one after another:

```yaml
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

### Accessing Step Results

Use the `_step` operator to access results from previously executed steps:

```yaml
- id: get_user
  type: MongoDBFindOne
  connectionId: users
  properties:
    query:
      email:
        _payload: email

- id: get_orders
  type: MongoDBFind
  connectionId: orders
  properties:
    query:
      user_id:
        _step: get_user._id  # Access the _id from get_user step
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

### Operators

APIs have access to all operators with server-side functionality, the following are the most relevant:

- [`_step`](/_step) - Access results from previous steps.
- [`_item`](/_item) - Access current item in :for and :parallel_for loops.
- [`_state`](/_state) - Access server-side state set with :set_state.
- [`_payload`](/_payload) - Access the payload sent from the client.
- [`_user`](/_user) - Access authenticated user information.
- [`_secret`](/_secret) - Access secrets from environment variables or secrets configuration.

## Calling APIs from the Client

Use the `CallAPI` action to call your API endpoints from pages:

```yaml
pages:
  - id: user_dashboard
    type: PageHeaderMenu
    blocks:
      - id: user_id_input
        type: TextInput
        properties:
          label: User ID

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

### Handling API Responses

The `CallAPI` action returns:
- `response`: The data returned by the API's :return statement
- `error`: Any error if the API failed or used :reject
- `success`: Boolean indicating if the API completed successfully
- `loading`: Boolean indicating if the API is currently executing
- `status`: The status of the API call

Access API responses using the `_api` operator on the client:

```yaml
blocks:
  - id: loading_spinner
    type: Spinner
    visible:
      _api: fetch_data.loading

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

## Error Handling Example

```yaml
events:
  onClick:
    try:
      - id: call_api
        type: CallAPI
        params:
          endpoint_id: process_data
          payload:
            data:
              _state: form_data

      - id: show_success
        type: Message
        params:
          content: 'Data processed successfully!'
          status: success

      - id: update_state
        type: SetState
        params:
          result:
            _actions: call_api.response

    catch:
      - id: show_error
        type: Message
        params:
          content:
            _string.concat:
              - 'Error: '
              - _actions: call_api.error
          status: error
```

## Complex Example: Order Processing API

Here's a comprehensive example showing various features:

```yaml
auth:
  api:
    protected:
      - process_order
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
              _user: id  # Ensure user owns this order

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
              method: POST
              url: /charge
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

## Best Practices

1. **Explicitly Protect Sensitive APIs**: Always add APIs that handle user data or sensitive operations to the protected list.
2. **Use Role-Based Access**: Configure specific roles for APIs that should have restricted access.
3. **Validate User Context**: In protected APIs, always validate that users can only access their own data.
4. **Audit Sensitive Operations**: Log access to sensitive APIs for security auditing.
5. **Be Aware of Default Public Access**: Remember that APIs are public by default - always protect APIs that shouldn't be publicly accessible.

Example of a secure API with user validation:

```yaml
auth:
  api:
    protected:
      - update_user_settings
    roles:
      user:
        - update_user_settings
      admin:
        - update_user_settings

api:
  - id: update_user_settings
    type: Api
    routine:
      # Validate that non-admin users can only update their own settings
      - :if:
          _and:
            - _not:
                _array.includes:
                  - _user: roles
                  - 'admin'
            - _ne:
                - _payload: user_id
                - _user: id
        :then:
          :reject: 'Unauthorized: You can only update your own settings'

      # Update settings
      - id: update_settings
        type: MongoDBUpdateOne
        connectionId: user-settings
        properties:
          filter:
            user_id:
              _payload: user_id
          update:
            $set:
              _payload: settings

      - :return:
          success: true
          message: 'Settings updated successfully'
```

## TLDR

- **Lowdefy APIs** create custom server-side endpoints that execute complex logic and are public by default - explicitly protect sensitive APIs in auth configuration
- **Routines** define the execution flow using steps and control structures
- **Control structures** like `:if`, `:for`, `:parallel`, and `:try` enable sophisticated flows
- **Steps** make requests to connections and can access results using `_step`
- **CallAPI action** is used to invoke APIs from the client with payloads
- **Server-side execution** provides access to secrets, connections, and server operators
- **Responses** are controlled with `:return` (success) and `:reject` (user errors)
- **_user** operator only works in protected APIs, not public ones
