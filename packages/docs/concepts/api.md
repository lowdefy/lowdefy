Lowdefy APIs allow you to create custom server-side API endpoints within your Lowdefy application. These endpoints can execute complex server-side logic, orchestrate multiple database or external API calls, perform data transformations, and implement business workflows that require server-side processing.

APIs are particularly useful when you need to:
- Coordinate multiple requests in a specific sequence
- Implement complex business logic that should run on the server
- Transform or aggregate data from multiple sources
- Create reusable endpoints that can be called from multiple pages
- Build webhook endpoints for external services

## How Lowdefy APIs Work

Lowdefy APIs are defined at the root level of your configuration, similar to connections and pages. Each API endpoint consists of a **routine** - a sequence of steps and control structures that define the execution flow. When an API is called from the client using the `CallAPI` action, the routine executes on the server with access to connections, secrets, and server-side operators.

The API execution flow:
1. Client calls the API using the `CallAPI` action with an optional payload
2. Server authorizes the request based on the API's auth configuration
3. The API routine executes sequentially (or in parallel where specified)
4. Each step can make requests to connections, transform data, or control flow
5. The API returns a response to the client

## API Definition

APIs are defined in the `api` array at the root of your Lowdefy configuration. Each API must have an `id`, `type`, and `routine`.

### API Schema

```yaml
api:
  - id: string        # Required - Unique identifier for the API endpoint
    type: string      # Required - The API type (typically 'Api')
    routine: array/object  # Required - The routine to execute
    auth:             # Optional - Authorization configuration
      public: boolean # Whether the API is publicly accessible
      roles: array    # Array of roles that can access this API
```

### Basic API Example

```yaml
lowdefy: 4.4.0

connections:
  - id: my_database
    type: MongoDB
    properties:
      uri:
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
            userId:
              _payload: userId
      - :return:
          _step: fetch_user

pages:
  # ... your pages
```

## Authentication and Authorization

Lowdefy APIs respect the same authentication and authorization rules as pages. By default, APIs require authentication unless explicitly made public. You can control access to your API endpoints using the `auth` configuration.

### Auth Configuration

The `auth` object on an API endpoint supports:
- `public: boolean` - Makes the API accessible without authentication
- `roles: string[]` - Restricts access to users with specific roles

### Protected APIs (Default)

By default, APIs require authentication:

```yaml
api:
  - id: protected_api
    type: Api
    routine:
      - :return:
          message: 'This API requires authentication'
          userId:
            _user: id
```

### Public APIs

Make an API publicly accessible without authentication:

```yaml
api:
  - id: public_api
    type: Api
    auth:
      public: true
    routine:
      - id: get_public_data
        type: MongoDBFind
        connectionId: public_content
        properties:
          query: {}
          options: {}
            limit: 10
      - :return:
          data:
            _step: get_public_data
```

### Role-Based Access Control

Restrict API access to users with specific roles:

```yaml
api:
  - id: admin_api
    type: Api
    auth:
      roles:
        - admin
        - super_admin
    routine:
      - id: get_sensitive_data
        type: MongoDBFind
        connectionId: sensitive_data
        properties:
          query: {}
          options:
            limit: 10
      - :return:
          data:
            _step: get_sensitive_data

  - id: manager_api
    type: Api
    auth:
      roles:
        - manager
        - admin
    routine:
      - id: get_reports
        type: MongoDBFind
        connectionId: reports
        properties:
          query:
            department:
              _user: department
      - :return:
          reports:
            _step: get_reports
```

### Using User Context

In authenticated APIs, you can access user information using the `_user` operator:

```yaml
api:
  - id: user_profile_api
    type: Api
    routine:
      - id: get_user_profile
        type: MongoDBFindOne
        connectionId: profiles
        properties:
          query:
            userId:
              _user: id  # Access the authenticated user's ID

      - id: log_access
        type: MongoDBInsertOne
        connectionId: access_logs
        properties:
          doc:
            userId:
              _user: id
            userEmail:
              _user: email
            userRoles:
              _user: roles
            action: 'view_profile'
            timestamp:
              _date: now

      - :return:
          profile:
            _step: get_user_profile
          user:
            id:
              _user: id
            email:
              _user: email
            roles:
              _user: roles
```

### Authorization Errors

When a user attempts to access an API they're not authorized for:
- Unauthenticated users trying to access protected APIs will receive an authentication error
- Authenticated users without required roles will receive an authorization error
- The API endpoint will appear as if it doesn't exist to unauthorized users

### Security Best Practices for APIs

1. **Default to Protected**: Unless specifically needed, don't make APIs public
2. **Use Specific Roles**: Define specific roles rather than broad permissions
3. **Validate User Context**: Always validate that users can only access their own data
4. **Audit Sensitive Operations**: Log access to sensitive APIs for security auditing

Example of a secure API with user validation:

```yaml
api:
  - id: update_user_settings
    type: Api
    auth:
      roles:
        - user
        - admin
    routine:
      # Validate that non-admin users can only update their own settings
      - :if:
          _and:
            - _not:
                _array.includes:
                  - _user: roles
                  - 'admin'
            - _ne:
                - _payload: userId
                - _user: id
        :then:
          :reject:
            error: 'Unauthorized: You can only update your own settings'
            code: 403

      # Update settings
      - id: update_settings
        type: MongoDBUpdateOne
        connectionId: user_settings
        properties:
          filter:
            userId:
              _payload: userId
          update:
            $set:
              _payload: settings

      - :return:
          success: true
          message: 'Settings updated successfully'
```

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
          _payload: userId

  - id: step_2
    type: MongoDBInsertOne
    connectionId: audit_log
    properties:
      doc:
        userId:
          _step: step_1._id
        action: 'user_viewed'
        timestamp:
          _date: now

  - :return:
      user:
        _step: step_1
      logged: true
```

### Accessing Request Results

Use the `_step` operator to access results from previous steps:

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
      userId:
        _step: get_user._id  # Access the _id from get_user step
```

## Control Structures

Control structures allow you to implement complex logic flows within your API routines.

### Conditional Execution (`:if`)

Execute different routines based on conditions:

```yaml
routine:
  - :if:
      _eq:
        - _payload: action
        - 'create'
    :then:
      - id: create_record
        type: MongoDBInsertOne
        connectionId: records
        properties:
          doc:
            _payload: data
      - :return:
          created: true
          id:
            _step: create_record.insertedId
    :else:
      - id: update_record
        type: MongoDBUpdateOne
        connectionId: records
        properties:
          filter:
            _id:
              _payload: id
          update:
            $set:
              _payload: data
      - :return:
          updated: true
          id:
            _payload: id
```

### Switch Statements (`:switch`)

Handle multiple conditions:

```yaml
routine:
  - :switch:
      - :case:
          _eq:
            - _payload: operation
            - 'sum'
        :then:
          :return:
            result:
              _sum:
                _payload: values

      - :case:
          _eq:
            - _payload: operation
            - 'average'
        :then:
          :return:
            result:
              _divide:
                - _sum:
                    _payload: values
                - _array.length:
                    _payload: values

    :default:
      :return:
        error: 'Unknown operation'
```

### Loops (`:for`)

Iterate over arrays to process items:

```yaml
routine:
  - id: get_product_ids
    type: MongoDBAggregation
    connectionId: orders
    properties:
      pipeline:
        - $match:
            status: 'pending'
        - $project:
            productId: 1

  - :for: product
    :in:
      _step: get_product_ids
    :do:
      - id: update_inventory
        type: MongoDBUpdateOne
        connectionId: products
        properties:
          filter:
            _id:
              _item: product.productId
          update:
            $inc:
              inventory: -1

  - :return:
      processed:
        _array.length:
          _step: get_product_ids
```

### Parallel Execution (`:parallel`)

Execute multiple routines simultaneously:

```yaml
routine:
  - :parallel:
      - id: fetch_user_details
        type: MongoDBFindOne
        connectionId: users
        properties:
          query:
            _id:
              _payload: userId

      - id: fetch_user_orders
        type: MongoDBFind
        connectionId: orders
        properties:
          query:
            userId:
              _payload: userId

      - id: fetch_user_preferences
        type: MongoDBFindOne
        connectionId: preferences
        properties:
          query:
            userId:
              _payload: userId

  - :return:
      user:
        _step: fetch_user_details
      orders:
        _step: fetch_user_orders
      preferences:
        _step: fetch_user_preferences
```

### Error Handling (`:try`)

Handle errors gracefully:

```yaml
routine:
  - :try:
      - id: risky_operation
        type: AxiosHttp
        connectionId: external_api
        properties:
          method: POST
          url: /process
          data:
            _payload: data

      - :return:
          success: true
          result:
            _step: risky_operation.data

    :catch:
      - :log:
          level: error
          message: 'External API failed'

      - :return:
          success: false
          error: 'Processing failed, please try again'

    :finally:
      - id: log_attempt
        type: MongoDBInsertOne
        connectionId: api_logs
        properties:
          doc:
            timestamp:
              _date: now
            api: 'process_data'
            success:
              _if:
                _step: risky_operation
                then: true
                else: false
```

### Return and Reject

Control API responses:

```yaml
routine:
  - id: validate_user
    type: MongoDBFindOne
    connectionId: users
    properties:
      query:
        _id:
          _payload: userId

  - :if:
      _not:
        _step: validate_user
    :then:
      :reject:
        error: 'User not found'
        code: 404

  - :return:
      user:
        _step: validate_user
      message: 'User retrieved successfully'
```

### State Management (`:set_state`)

Maintain state during API execution:

```yaml
routine:
  - :set_state:
      processedCount: 0
      errors: []

  - :for: item
    :in:
      _payload: items
    :do:
      - :try:
          - id: process_item
            type: MongoDBInsertOne
            connectionId: processed_items
            properties:
              doc:
                _item: item

          - :set_state:
              processedCount:
                _sum:
                  - _state: processedCount
                  - 1

        :catch:
          - :set_state:
              errors:
                _array.concat:
                  - _state: errors
                  - - _item: item.id

  - :return:
      processed:
        _state: processedCount
      errors:
        _state: errors
      success:
        _eq:
          - _array.length:
              _state: errors
          - 0
```

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
                endpointId: get_user_data
                payload:
                  userId:
                    _state: user_id_input

            - id: set_user_data
              type: SetState
              params:
                userData:
                  _actions: call_user_api.response.user

      - id: user_display
        type: Json
        properties:
          data:
            _state: userData
```

### Handling API Responses

The `CallAPI` action returns:
- `response`: The data returned by the API's `:return` statement
- `error`: Any error if the API failed or used `:reject`
- `success`: Boolean indicating if the API completed successfully

```yaml
events:
  onClick:
    try:
      - id: call_api
        type: CallAPI
        params:
          endpointId: process_data
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
              - _actions: call_api.error.message
          status: error
```

## Complex Example: Order Processing API

Here's a comprehensive example showing various features:

```yaml
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
              _payload: orderId
            status: 'pending'

      - :if:
          _not:
            _step: validate_order
        :then:
          :reject:
            error: 'Order not found or already processed'
            code: 404

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
                  _item: item.productId
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
            connectionId: payment_gateway
            properties:
              method: POST
              url: /charge
              data:
                amount:
                  _step: validate_order.total
                currency: 'USD'
                source:
                  _payload: paymentToken

        :catch:
          - id: mark_payment_failed
            type: MongoDBUpdateOne
            connectionId: orders
            properties:
              filter:
                _id:
                  _payload: orderId
              update:
                $set:
                  status: 'payment_failed'
                  failedAt:
                    _date: now

          - :reject:
              error: 'Payment processing failed'
              code: 402

      # Update order status
      - id: complete_order
        type: MongoDBUpdateOne
        connectionId: orders
        properties:
          filter:
            _id:
              _payload: orderId
          update:
            $set:
              status: 'completed'
              paymentId:
                _step: process_payment.data.id
              completedAt:
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
                  _item: item.productId
              update:
                $inc:
                  inventory:
                    _product:
                      - _item: item.quantity
                      - -1

      # Send confirmation email
      - id: send_confirmation
        type: SendGridMail
        connectionId: email_service
        properties:
          to:
            _step: validate_order.customerEmail
          template_id: 'order_confirmation'
          dynamic_template_data:
            orderId:
              _payload: orderId
            total:
              _step: validate_order.total

      # Return success
      - :return:
          success: true
          orderId:
            _payload: orderId
          paymentId:
            _step: process_payment.data.id
          message: 'Order processed successfully'
```

## Best Practices

### Security
- Always validate input payloads
- Use `:reject` to return user-friendly error messages
- Keep sensitive logic and data transformations on the server
- Use the `auth` configuration to control access

### Performance
- Use `:parallel` when operations don't depend on each other
- Minimize database calls by using efficient queries
- Consider caching frequently accessed data

### Error Handling
- Always use `:try`/`:catch` for external API calls
- Provide meaningful error messages
- Log errors for debugging
- Use `:finally` for cleanup operations

### Code Organization
- Keep routines focused on a single responsibility
- Use descriptive step IDs
- Comment complex logic
- Consider breaking very long routines into multiple APIs

## TLDR

- **Lowdefy APIs** create custom server-side endpoints that execute complex logic
- **Routines** define the execution flow using steps and control structures
- **Control structures** like `:if`, `:for`, `:parallel`, and `:try` enable sophisticated flows
- **Steps** make requests to connections and can access results using `_step`
- **CallAPI action** is used to invoke APIs from the client with payloads
- **Server-side execution** provides access to secrets, connections, and server operators
- **Responses** are controlled with `:return` (success) and `:reject` (user errors)
