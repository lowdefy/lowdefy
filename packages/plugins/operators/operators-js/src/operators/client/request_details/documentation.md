<TITLE>
_request_details
</TITLE>

<METADATA>
env: Client Only
</METADATA>

<DESCRIPTION>
The `_request_details` operator returns detailed metadata about a request, including its loading state, timing information, and response data. This provides more comprehensive information than the `_request` operator, which only returns the response data.

**Response Object Structure:**

- `blockId: string` - The ID of the block from which the request was initiated
- `loading: boolean` - `true` while the request is in progress, `false` when complete
- `payload: object` - The payload data sent with the request
- `requestId: string` - The ID of the request
- `response: any` - The data returned by the request (null while loading)
- `responseTime: number` - The time taken to complete the request in milliseconds

Use `_request_details` when you need to:

- Show loading indicators
- Display response timing
- Access the request payload
- Check the loading state for conditional rendering
  </DESCRIPTION>

<SCHEMA>
```yaml
_request_details:
  type: string | boolean | object
  description: Access detailed information about a request.
  oneOf:
    - type: string
      description: The request ID. Dot notation supported for accessing specific properties.
    - type: boolean
      description: If true, returns details for all requests.
    - type: object
      properties:
        key:
          type: string
          description: The request ID. Dot notation supported.
        all:
          type: boolean
          description: If true, returns details for all requests.
        default:
          type: any
          description: Value to return if the request details are not found.
```
</SCHEMA>

<EXAMPLES>

###### Example 1: Basic loading state indicator

Show a loading spinner while a request is in progress.

```yaml
events:
  onMount:
    - id: fetch_data
      type: Request
      params: get_dashboard_data

blocks:
  - id: loading_spinner
    type: Spin
    visible:
      _request_details: get_dashboard_data.loading
    properties:
      tip: Loading dashboard data...

  - id: dashboard_content
    type: Box
    visible:
      _not:
        _request_details: get_dashboard_data.loading
    blocks:
      - id: data_display
        type: Statistic
        properties:
          title: Total Records
          value:
            _array.length:
              _request: get_dashboard_data
```

---

###### Example 2: Display request timing information

Show performance metrics for data fetching.

```yaml
blocks:
  - id: data_table
    type: AgGridAlpine
    properties:
      rowData:
        _request: get_records

  - id: performance_info
    type: Descriptions
    visible:
      _not:
        _request_details: get_records.loading
    properties:
      title: Query Performance
      size: small
      items:
        - label: Request ID
          value:
            _request_details: get_records.requestId
        - label: Response Time
          value:
            _string.concat:
              - _request_details: get_records.responseTime
              - ' ms'
        - label: Records Returned
          value:
            _array.length:
              _request: get_records
        - label: Initiated From
          value:
            _request_details: get_records.blockId
```

---

###### Example 3: Conditional button states based on request status

Disable buttons and show appropriate states during requests.

```yaml
id: action_buttons
type: Box
layout:
  direction: row
  contentGutter: 8
blocks:
  - id: refresh_button
    type: Button
    properties:
      title:
        _if:
          test:
            _request_details: get_data.loading
          then: Refreshing...
          else: Refresh Data
      icon:
        _if:
          test:
            _request_details: get_data.loading
          then: AiOutlineLoading
          else: AiOutlineReload
      loading:
        _request_details: get_data.loading
      disabled:
        _request_details: get_data.loading
    events:
      onClick:
        - id: refresh
          type: Request
          params: get_data

  - id: export_button
    type: Button
    properties:
      title: Export
      icon: AiOutlineDownload
      disabled:
        _or:
          - _request_details: get_data.loading
          - _eq:
              - _request: get_data
              - null
```

---

###### Example 4: Multiple request status monitoring

Track the status of several concurrent requests.

```yaml
events:
  onMount:
    - id: fetch_all_data
      type: Parallel
      params:
        - id: fetch_users
          type: Request
          params: get_users
        - id: fetch_products
          type: Request
          params: get_products
        - id: fetch_orders
          type: Request
          params: get_orders

blocks:
  - id: loading_status
    type: Card
    visible:
      _or:
        - _request_details: get_users.loading
        - _request_details: get_products.loading
        - _request_details: get_orders.loading
    properties:
      title: Loading Data
    blocks:
      - id: status_list
        type: List
        properties:
          data:
            - name: Users
              loading:
                _request_details: get_users.loading
              time:
                _request_details: get_users.responseTime
            - name: Products
              loading:
                _request_details: get_products.loading
              time:
                _request_details: get_products.responseTime
            - name: Orders
              loading:
                _request_details: get_orders.loading
              time:
                _request_details: get_orders.responseTime
        blocks:
          - id: status_item.$
            type: Box
            layout:
              direction: row
            blocks:
              - id: status_icon.$
                type: Icon
                properties:
                  name:
                    _if:
                      test:
                        _state: status.$.loading
                      then: AiOutlineLoading
                      else: AiOutlineCheckCircle
                  color:
                    _if:
                      test:
                        _state: status.$.loading
                      then: '#1890ff'
                      else: '#52c41a'
              - id: status_text.$
                type: Paragraph
                properties:
                  content:
                    _if:
                      test:
                        _state: status.$.loading
                      then:
                        _string.concat:
                          - _state: status.$.name
                          - ': Loading...'
                      else:
                        _string.concat:
                          - _state: status.$.name
                          - ': Loaded in '
                          - _state: status.$.time
                          - 'ms'
```

---

###### Example 5: Advanced request debugging and payload inspection

Full request lifecycle monitoring for development.

```yaml
id: debug_panel
type: Collapse
visible:
  _global: features.debug_mode
properties:
  defaultActiveKey:
    - request_debug
  panels:
    - key: request_debug
      title: Request Debug Information
blocks:
  - id: request_details_display
    type: Box
    blocks:
      - id: request_info
        type: Descriptions
        properties:
          title:
            _string.concat:
              - 'Request: '
              - _request_details: fetch_records.requestId
          bordered: true
          items:
            - label: Status
              value:
                _if:
                  test:
                    _request_details: fetch_records.loading
                  then: '⏳ Loading'
                  else: '✅ Complete'
            - label: Response Time
              value:
                _if:
                  test:
                    _request_details: fetch_records.responseTime
                  then:
                    _string.concat:
                      - _request_details: fetch_records.responseTime
                      - ' ms'
                  else: 'N/A'
            - label: Triggered By
              value:
                _if_none:
                  - _request_details: fetch_records.blockId
                  - 'Page mount'

      - id: payload_section
        type: Card
        properties:
          title: Request Payload
          size: small
        blocks:
          - id: payload_json
            type: Json
            properties:
              value:
                _request_details: fetch_records.payload

      - id: response_section
        type: Card
        properties:
          title: Response Data
          size: small
        blocks:
          - id: response_json
            type: Json
            visible:
              _not:
                _request_details: fetch_records.loading
            properties:
              value:
                _request_details: fetch_records.response
          - id: response_loading
            type: Paragraph
            visible:
              _request_details: fetch_records.loading
            properties:
              content: Waiting for response...

      - id: all_requests_overview
        type: Card
        properties:
          title: All Requests Status
        blocks:
          - id: all_requests_json
            type: Json
            properties:
              value:
                _request_details:
                  all: true
```

</EXAMPLES>
