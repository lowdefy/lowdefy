<TITLE>
_payload
</TITLE>

<METADATA>
env: Server Only
</METADATA>

<DESCRIPTION>
The `_payload` operator retrieves values from the payload object in server-side contexts. The payload contains data sent from the client when calling API endpoints or executing requests.

**Usage Contexts:**

- **API Routines**: Access data sent via the `CallAPI` action's payload property
- **Requests**: Access data passed through the `Request` action's payload property
- **Connections**: Access dynamic configuration values

The payload object is the bridge between client-side user interactions and server-side processing, allowing you to pass form data, identifiers, filters, and any other data needed for server operations.
</DESCRIPTION>

<SCHEMA>
```yaml
_payload:
  type: string | boolean | object
  description: Access values from the server payload object.
  oneOf:
    - type: string
      description: The key to retrieve from payload. Dot notation supported.
    - type: boolean
      description: If true, returns the entire payload object.
    - type: object
      properties:
        key:
          type: string
          description: The key to retrieve. Dot notation supported.
        all:
          type: boolean
          description: If true, returns the entire payload object.
        default:
          type: any
          description: Value to return if the key is not found.
```
</SCHEMA>

<EXAMPLES>

###### Example 1: Payload in MongoDB aggregation request

Pass filter parameters from the client to a MongoDB aggregation pipeline.

**Client-side page configuration:**

```yaml
id: orders-report
type: PageHeaderMenu
properties:
  title: Orders Report

events:
  onMount:
    - id: fetch_orders
      type: Request
      params: get_orders_aggregation

requests:
  - _ref: requests/get_orders_aggregation.yaml

blocks:
  - id: date_filter
    type: DateRangePicker
    properties:
      title: Date Range

  - id: status_filter
    type: MultipleSelector
    properties:
      title: Order Status
      options:
        - label: Pending
          value: pending
        - label: Processing
          value: processing
        - label: Completed
          value: completed

  - id: apply_filters
    type: Button
    properties:
      title: Apply Filters
    events:
      onClick:
        - id: refresh_data
          type: Request
          params: get_orders_aggregation
```

**Request definition with payload:**

```yaml
# requests/get_orders_aggregation.yaml
id: get_orders_aggregation
type: MongoDBAggregation
connectionId: orders
payload:
  date_from:
    _if:
      test:
        _state: date_filter
      then:
        _array.get:
          on:
            _state: date_filter
          index: 0
      else: null
  date_to:
    _if:
      test:
        _state: date_filter
      then:
        _array.get:
          on:
            _state: date_filter
          index: 1
      else: null
  statuses:
    _if_none:
      - _state: status_filter
      - []
properties:
  pipeline:
    - $match:
        $and:
          - created_at:
              $gte:
                _if:
                  test:
                    _payload: date_from
                  then:
                    _date:
                      _payload: date_from
                  else:
                    _date.subtract:
                      - _date: now
                      - 30
                      - days
          - created_at:
              $lte:
                _if:
                  test:
                    _payload: date_to
                  then:
                    _date:
                      _payload: date_to
                  else:
                    _date: now
          - status:
              $in:
                _if:
                  test:
                    _gt:
                      - _array.length:
                          _payload: statuses
                      - 0
                  then:
                    _payload: statuses
                  else:
                    - pending
                    - processing
                    - completed
    - $group:
        _id: $status
        count:
          $sum: 1
        total_value:
          $sum: $amount
    - $sort:
        total_value: -1
```

---

###### Example 2: Payload in MongoDBFindOne request

Fetch a single record using an ID passed from state.

**Client-side page configuration:**

```yaml
id: product-details
type: PageHeaderMenu
properties:
  title: Product Details

events:
  onMount:
    - id: fetch_product
      type: Request
      params: get_product_by_id

requests:
  - _ref: requests/get_product_by_id.yaml

blocks:
  - id: product_name
    type: Title
    properties:
      content:
        _request: get_product_by_id.name

  - id: product_info
    type: Descriptions
    properties:
      items:
        - label: SKU
          value:
            _request: get_product_by_id.sku
        - label: Price
          value:
            _request: get_product_by_id.price
        - label: Category
          value:
            _request: get_product_by_id.category
```

**Request definition with payload:**

```yaml
# requests/get_product_by_id.yaml
id: get_product_by_id
type: MongoDBFindOne
connectionId: products
payload:
  product_id:
    _url_query: _id
properties:
  query:
    _id:
      _payload: product_id
```

---

###### Example 3: Payload in API routine with CallAPI action

Create a new order through an API endpoint.

**Client-side page configuration:**

```yaml
id: checkout
type: PageHeaderMenu
properties:
  title: Checkout

blocks:
  - id: shipping_form
    type: Card
    properties:
      title: Shipping Information
    blocks:
      - id: shipping_name
        type: TextInput
        properties:
          title: Full Name
      - id: shipping_address
        type: TextInput
        properties:
          title: Address
      - id: shipping_city
        type: TextInput
        properties:
          title: City
      - id: shipping_postal
        type: TextInput
        properties:
          title: Postal Code

  - id: order_notes
    type: TextArea
    properties:
      title: Order Notes (Optional)

  - id: place_order_button
    type: Button
    properties:
      title: Place Order
      type: primary
    events:
      onClick:
        - id: validate_form
          type: Validate
        - id: submit_order
          type: CallAPI
          params:
            endpointId: create-order
            payload:
              customer_id:
                _user: id
              shipping:
                name:
                  _state: shipping_name
                address:
                  _state: shipping_address
                city:
                  _state: shipping_city
                postal_code:
                  _state: shipping_postal
              items:
                _state: cart_items
              notes:
                _state: order_notes
              total:
                _state: cart_total
        - id: show_success
          type: Message
          params:
            content:
              _string.concat:
                - 'Order placed! Order ID: '
                - _actions: submit_order.response.order_id
            type: success
        - id: redirect
          type: Link
          params:
            pageId: order-confirmation
            urlQuery:
              order_id:
                _actions: submit_order.response.order_id
```

**API routine definition using payload:**

```yaml
# api/create-order.yaml
id: create-order
type: Api
routine:
  - id: create_order_record
    type: MongoDBInsertOne
    connectionId: orders
    properties:
      doc:
        customer_id:
          _payload: customer_id
        shipping:
          name:
            _payload: shipping.name
          address:
            _payload: shipping.address
          city:
            _payload: shipping.city
          postal_code:
            _payload: shipping.postal_code
        items:
          _payload: items
        notes:
          _payload: notes
        total:
          _payload: total
        status: pending
        created_at:
          _date: now

  - :return:
      success: true
      order_id:
        _step: create_order_record.insertedId
```

---

###### Example 4: Payload with pagination in MongoDBFind

Implement paginated data fetching with search and filters.

**Client-side page configuration:**

```yaml
id: customers-list
type: PageHeaderMenu
properties:
  title: Customers

events:
  onMount:
    - id: set_pagination
      type: SetState
      params:
        pagination:
          current: 1
          pageSize: 20
          skip: 0
    - id: fetch_customers
      type: Request
      params: search_customers

requests:
  - _ref: requests/search_customers.yaml

blocks:
  - id: search_box
    type: TextInput
    properties:
      title: Search
      placeholder: Search by name or email...
    events:
      onPressEnter:
        - id: reset_pagination
          type: SetState
          params:
            pagination:
              current: 1
              pageSize: 20
              skip: 0
        - id: search
          type: Request
          params: search_customers

  - id: status_filter
    type: Selector
    properties:
      title: Status
      allowClear: true
      options:
        - label: Active
          value: active
        - label: Inactive
          value: inactive

  - id: customers_table
    type: AgGridAlpine
    properties:
      rowData:
        _request: search_customers.data
      columnDefs:
        - field: name
          headerName: Name
        - field: email
          headerName: Email
        - field: status
          headerName: Status

  - id: pagination
    type: Pagination
    properties:
      current:
        _state: pagination.current
      pageSize:
        _state: pagination.pageSize
      total:
        _request: search_customers.total
    events:
      onChange:
        - id: update_pagination
          type: SetState
          params:
            pagination:
              current:
                _event: current
              pageSize:
                _event: pageSize
              skip:
                _product:
                  - _subtract:
                      - _event: current
                      - 1
                  - _event: pageSize
        - id: fetch_page
          type: Request
          params: search_customers
```

**Request definition with payload:**

```yaml
# requests/search_customers.yaml
id: search_customers
type: MongoDBAggregation
connectionId: customers
payload:
  search_term:
    _state: search_box
  status:
    _state: status_filter
  skip:
    _state: pagination.skip
  limit:
    _state: pagination.pageSize
properties:
  pipeline:
    - $match:
        $and:
          - $or:
              - name:
                  $regex:
                    _payload:
                      key: search_term
                      default: ''
                  $options: i
              - email:
                  $regex:
                    _payload:
                      key: search_term
                      default: ''
                  $options: i
          - status:
              _if:
                test:
                  _payload: status
                then:
                  _payload: status
                else:
                  $exists: true
    - $facet:
        data:
          - $sort:
              name: 1
          - $skip:
              _payload: skip
          - $limit:
              _payload: limit
        total:
          - $count: count
    - $project:
        data: 1
        total:
          $arrayElemAt:
            - $total.count
            - 0
```

---

###### Example 5: Payload with default values and complex filtering

Build a product search with multiple optional filter criteria.

**Client-side page configuration:**

```yaml
id: products-search
type: PageHeaderMenu
properties:
  title: Product Search

events:
  onMount:
    - id: init_filters
      type: SetState
      params:
        filters:
          search: ''
          categories: []
          price_min: null
          price_max: null
          in_stock_only: false
          sort_by: name
          sort_order: 1
        pagination:
          page: 1
          page_size: 25
    - id: fetch_products
      type: Request
      params: filter_products

requests:
  - _ref: requests/filter_products.yaml

blocks:
  - id: filter_panel
    type: Card
    properties:
      title: Filters
    blocks:
      - id: search_input
        type: TextInput
        properties:
          title: Search Products
          value:
            _state: filters.search

      - id: category_filter
        type: MultipleSelector
        properties:
          title: Categories
          value:
            _state: filters.categories
          options:
            _global: enums.product_categories

      - id: price_range
        type: Box
        layout:
          direction: row
        blocks:
          - id: price_min
            type: NumberInput
            properties:
              title: Min Price
              value:
                _state: filters.price_min
          - id: price_max
            type: NumberInput
            properties:
              title: Max Price
              value:
                _state: filters.price_max

      - id: in_stock_toggle
        type: Switch
        properties:
          title: In Stock Only
          checked:
            _state: filters.in_stock_only

      - id: sort_select
        type: Selector
        properties:
          title: Sort By
          value:
            _state: filters.sort_by
          options:
            - label: Name (A-Z)
              value: name
            - label: Price (Low to High)
              value: price_asc
            - label: Price (High to Low)
              value: price_desc
            - label: Newest First
              value: created_desc

      - id: apply_button
        type: Button
        properties:
          title: Apply Filters
          type: primary
        events:
          onClick:
            - id: update_filters
              type: SetState
              params:
                filters:
                  search:
                    _state: search_input
                  categories:
                    _state: category_filter
                  price_min:
                    _state: price_min
                  price_max:
                    _state: price_max
                  in_stock_only:
                    _state: in_stock_toggle
                  sort_by:
                    _state: sort_select
                pagination:
                  page: 1
                  page_size: 25
            - id: search
              type: Request
              params: filter_products

  - id: results_table
    type: AgGridAlpine
    properties:
      rowData:
        _request: filter_products.products
```

**Request definition with payload:**

```yaml
# requests/filter_products.yaml
id: filter_products
type: MongoDBAggregation
connectionId: products
payload:
  search:
    _state: filters.search
  categories:
    _state: filters.categories
  price_min:
    _state: filters.price_min
  price_max:
    _state: filters.price_max
  in_stock_only:
    _state: filters.in_stock_only
  sort_by:
    _state: filters.sort_by
  page:
    _state: pagination.page
  page_size:
    _state: pagination.page_size
properties:
  pipeline:
    # Build match stage
    - $match:
        active: true
        $and:
          # Text search filter
          - $or:
              - name:
                  $regex:
                    _payload:
                      key: search
                      default: ''
                  $options: i
              - description:
                  $regex:
                    _payload:
                      key: search
                      default: ''
                  $options: i
              - sku:
                  $regex:
                    _payload:
                      key: search
                      default: ''
                  $options: i
          # Category filter (only if categories selected)
          - category:
              $in:
                _if:
                  test:
                    _gt:
                      - _array.length:
                          _payload:
                            key: categories
                            default: []
                      - 0
                  then:
                    _payload: categories
                  else:
                    _mql.aggregate:
                      on:
                        _global: enums.product_categories
                      pipeline:
                        - $project:
                            value: 1
          # Price range filter
          - price:
              $gte:
                _payload:
                  key: price_min
                  default: 0
          - price:
              $lte:
                _payload:
                  key: price_max
                  default: 999999
          # Stock filter
          - stock_quantity:
              $gte:
                _if:
                  test:
                    _payload: in_stock_only
                  then: 1
                  else: 0

    # Sort stage
    - $sort:
        _switch:
          branches:
            - if:
                _eq:
                  - _payload: sort_by
                  - price_asc
              then:
                price: 1
            - if:
                _eq:
                  - _payload: sort_by
                  - price_desc
              then:
                price: -1
            - if:
                _eq:
                  - _payload: sort_by
                  - created_desc
              then:
                created_at: -1
          default:
            name: 1

    # Pagination with facet
    - $facet:
        products:
          - $skip:
              _product:
                - _subtract:
                    - _payload:
                        key: page
                        default: 1
                    - 1
                - _payload:
                    key: page_size
                    default: 25
          - $limit:
              _payload:
                key: page_size
                default: 25
        total_count:
          - $count: count

    # Reshape output
    - $project:
        products: 1
        total:
          $ifNull:
            - $arrayElemAt:
                - $total_count.count
                - 0
            - 0
        page:
          _payload:
            key: page
            default: 1
        page_size:
          _payload:
            key: page_size
            default: 25
```

</EXAMPLES>
