<TITLE>
api
</TITLE>

<METADATA>
env: Client Only
</METADATA>

<DESCRIPTION>
The `_api` operator returns the response object from an API endpoint that has been called using the [`CallAPI`](/CallAPI) action. This operator is only available on the client side (in pages) and provides access to the full API response object including the response data, loading state, success status, and any errors. If the API endpoint has not yet been called or is still executing, the returned value is `null`. Dot notation is supported for accessing nested properties.

The response includes the following fields:

- `blockId: string`: The block id of the block from which the API call was initiated.
- `endTimestamp: date`: The timestamp when the API call ended.
- `endpointId: string`: The endpoint id of the API endpoint that was called.
- `error: object`: Any error if the API endpoint failed or used :reject.
- `loading: boolean`: When `true`, the API endpoint is awaiting a response.
- `pageId: string`: The page id of the page from which the API call was initiated.
- `payload: object`: The payload sent with the API call.
- `response: object`: The data returned by the API endpoint's :return statement.
- `responseTime: number`: The time taken to get the response in milliseconds.
- `startTimestamp: date`: The timestamp when the API call started.
- `status: string`: The status of the API call.
- `success: boolean`: When `true`, the API call completed successfully.
  </DESCRIPTION>

<USAGE>

```
(endpointId: string): any

###### string
The endpoint id of the API endpoint that was called using the CallAPI action.
```

</USAGE>

<EXAMPLES>
###### Accessing the full API response object:
```yaml
blocks:
  - id: fetch_button
    type: Button
    properties:
      title: Load User Data
    events:
      onClick:
        - id: call_user_api
          type: CallAPI
          params:
            endpointId: get_user_profile
            payload:
              user_id:
                _state: selected_user_id

- id: api_response_display
  type: Descriptions
  properties:
  items:
  \_api: get_user_profile # Returns the full response object

````
Returns: The complete API response object containing response, error, success, status, loading, and timing information.

###### Using dot notation to access the response data:
```yaml
blocks:
  - id: user_name_display
    type: Paragraph
    properties:
      content:
        _if:
          test:
            _api: get_user_profile.success
          then:
            _string.concat:
              - 'Welcome, '
              - _api: get_user_profile.response.name
          else: 'User not loaded'

  - id: user_email_display
    type: Html
    properties:
      html:
        _nunjucks:
          template: |
            <div>
              <span>Email:</span>
              <span>
                {{ email }}
              </span>
            </div>
          on:
            email:
              _api: get_user_profile.response.email
````

###### Checking loading and error states:

```yaml
events:
  onMount:
    - id: fetch_products
      type: CallAPI
      params:
        endpointId: get_products
    - id: set_products_list
      type: SetState
      params:
        products_list
          _api: fetch_products.response.products

blocks:
  - id: loading_text
    type: Html
    visible:
      _api: fetch_products.loading # Show loading text while API is loading
    properties:
      html: '<div class="secondary">Loading...</div>'

  - id: error_message
    type: Alert
    visible:
      _not:
        _api: fetch_products.success
    properties:
      type: error
      message:
        _if:
          test:
            _api: fetch_products.error
          then:
            _api: fetch_products.error.message
          else: 'An error occurred'

  - id: products_list
    type: List
    visible:
      _and:
        - _api: fetch_products.success
        - _not:
            _api: fetch_products.loading
```

###### Working with multiple API calls:

```yaml
blocks:
  - id: load_all_button
    type: Button
    properties:
      title: Load All Data
    events:
      onClick:
        - id: fetch_user
          type: CallAPI
          params:
            endpointId: get_current_user

        - id: fetch_permissions
          type: CallAPI
          params:
            endpointId: get_user_permissions
            payload:
              user_id:
                _api: get_current_user.response._id

        - id: fetch_dashboard_data
          type: CallAPI
          params:
            endpointId: get_dashboard_stats
            payload:
              permission_level:
                _api: get_user_permissions.response.level

  - id: dashboard_container
    type: Box
    visible:
      _and:
        - _api: get_current_user.success
        - _api: get_user_permissions.success
        - _api: get_dashboard_stats.success
    blocks:
      - id: welcome_message
        type: Title
        properties:
          content:
            _string.concat:
              - 'Dashboard for '
              - _api: get_current_user.response.name

      - id: stats_display
        type: Statistic
        properties:
          title: Total Revenue
          value:
            _api: get_dashboard_stats.response.total_revenue
```

###### Using API response in form validation:

```yaml
blocks:
  - id: check_username_button
    type: Button
    properties:
      title: Check Availability
    events:
      onClick:
        - id: check_username
          type: CallAPI
          params:
            endpointId: validate_username
            payload:
              username:
                _state: username_input

  - id: username_input
    type: TextInput
    properties:
      title: Username
      disabled:
        _eq:
          - _api: validate_username.response.available
          - false
      label:
        extra:
          _if:
            test:
              _api: validate_username.response
            then:
              _if:
                test:
                  _api: validate_username.response.available
                then: 'Username is available!'
                else: 'Username is already taken'
            else: 'Enter a username and check availability'
```

###### Accessing API response time and metadata:

```yaml
blocks:
  - id: api_debug_info
    type: Descriptions
    properties:
      items:
        - label: API Status
          value:
            _api: fetch_data.status
        - label: Success
          value:
            _api: fetch_data.success
        - label: Response Time
          value:
            _string.concat:
              - _api: fetch_data.responseTime
              - 'ms'
        - label: Timestamp
          value:
            _date.format:
              - _api: fetch_data.endTimestamp
              - 'HH:mm:ss'
```

</EXAMPLES>
