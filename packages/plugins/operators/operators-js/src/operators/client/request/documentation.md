<TITLE>
_request
</TITLE>

<METADATA>
env: Client Only
</METADATA>

<DESCRIPTION>
The `_request` operator returns the response value from a request that has been executed on the page. Requests are defined in the page's `requests` array and are typically called using the [`Request`](/Request) action.

**Behavior:**

- If the request has not been called, returns `null`
- If the request is currently loading, returns `null`
- If the request completed successfully, returns the response data
- Dot notation is supported for accessing nested properties
- Block list indexes (`$`) are supported for accessing array elements in list contexts

For detailed request metadata (loading state, timing, errors), use the [`_request_details`](/_request_details) operator instead.
</DESCRIPTION>

<SCHEMA>
```yaml
_request:
  type: string
  description: |
    The request ID to retrieve the response from.
    Supports dot notation for nested properties (e.g., "get_user.profile.name").
    Supports block list indexes with $ (e.g., "get_items.$.name").
  returns: any
```
</SCHEMA>

<EXAMPLES>

###### Example 1: Basic request response display

Display data from a simple request.

```yaml
requests:
  - id: get_user_profile
    type: MongoDBFindOne
    connectionId: users
    properties:
      query:
        _id:
          _user: id

blocks:
  - id: user_name
    type: Title
    properties:
      content:
        _request: get_user_profile.name

  - id: user_email
    type: Paragraph
    properties:
      content:
        _request: get_user_profile.email
```

---

###### Example 2: Using request data in a table

Populate a data table with request results.

```yaml
requests:
  - id: get_all_products
    type: MongoDBFind
    connectionId: products
    properties:
      query:
        active: true
      options:
        sort:
          name: 1

blocks:
  - id: products_table
    type: AgGridAlpine
    properties:
      rowData:
        _request: get_all_products
      columnDefs:
        - field: name
          headerName: Product Name
        - field: category
          headerName: Category
        - field: price
          headerName: Price
          valueFormatter:
            _function:
              __string.concat:
                - '$'
                - __args.0.value
```

---

###### Example 3: Chaining requests with dot notation

Access nested data from related requests.

```yaml
events:
  onMount:
    - id: fetch_order
      type: Request
      params: get_order_details
    - id: fetch_customer
      type: Request
      params:
        customer_id:
          _request: get_order_details.customer_id

requests:
  - id: get_order_details
    type: MongoDBFindOne
    connectionId: orders
    properties:
      query:
        _id:
          _url_query: order_id

  - id: get_customer_info
    type: MongoDBFindOne
    connectionId: customers
    payload:
      customer_id:
        _event: customer_id
    properties:
      query:
        _id:
          _payload: customer_id

blocks:
  - id: order_summary
    type: Descriptions
    properties:
      items:
        - label: Order ID
          value:
            _request: get_order_details._id
        - label: Order Date
          value:
            _date.format:
              - _request: get_order_details.created_at
              - 'MMMM D, YYYY'
        - label: Customer Name
          value:
            _request: get_customer_info.name
        - label: Customer Email
          value:
            _request: get_customer_info.email
        - label: Total Amount
          value:
            _string.concat:
              - '$'
              - _request: get_order_details.total
```

---

###### Example 4: Using request data in lists with block indexes

Access array elements using the $ index in list contexts.

```yaml
requests:
  - id: get_order_items
    type: MongoDBFind
    connectionId: order_items
    properties:
      query:
        order_id:
          _url_query: order_id

blocks:
  - id: items_list
    type: List
    properties:
      data:
        _request: get_order_items
    blocks:
      - id: item_card.$
        type: Card
        properties:
          title:
            _request: get_order_items.$.product_name
        blocks:
          - id: item_details.$
            type: Descriptions
            layout:
              span: 12
            properties:
              items:
                - label: SKU
                  value:
                    _request: get_order_items.$.sku
                - label: Quantity
                  value:
                    _request: get_order_items.$.quantity
                - label: Unit Price
                  value:
                    _string.concat:
                      - '$'
                      - _request: get_order_items.$.unit_price
                - label: Line Total
                  value:
                    _string.concat:
                      - '$'
                      - _product:
                          - _request: get_order_items.$.quantity
                          - _request: get_order_items.$.unit_price
```

---

###### Example 5: Conditional rendering based on request data

Show different content based on request results.

```yaml
requests:
  - id: get_user_subscription
    type: MongoDBFindOne
    connectionId: subscriptions
    properties:
      query:
        user_id:
          _user: id

events:
  onMount:
    - id: fetch_subscription
      type: Request
      params: get_user_subscription

blocks:
  # Show loading state
  - id: loading_indicator
    type: Skeleton
    visible:
      _eq:
        - _request: get_user_subscription
        - null

  # Show premium content for active subscriptions
  - id: premium_features
    type: Card
    visible:
      _and:
        - _ne:
            - _request: get_user_subscription
            - null
        - _eq:
            - _request: get_user_subscription.status
            - active
    properties:
      title: Premium Features
    blocks:
      - id: subscription_info
        type: Descriptions
        properties:
          items:
            - label: Plan
              value:
                _request: get_user_subscription.plan_name
            - label: Expires
              value:
                _date.format:
                  - _request: get_user_subscription.expires_at
                  - 'MMMM D, YYYY'
            - label: Features
              value:
                _array.join:
                  - _request: get_user_subscription.features
                  - ', '

  # Show upgrade prompt for non-subscribers
  - id: upgrade_prompt
    type: Card
    visible:
      _or:
        - _eq:
            - _request: get_user_subscription
            - null
        - _ne:
            - _request: get_user_subscription.status
            - active
    properties:
      title: Upgrade to Premium
    blocks:
      - id: upgrade_message
        type: Paragraph
        properties:
          content: Unlock all features with a premium subscription!
      - id: upgrade_button
        type: Button
        properties:
          title: View Plans
          type: primary
        events:
          onClick:
            - id: go_to_pricing
              type: Link
              params:
                pageId: pricing
```

</EXAMPLES>
