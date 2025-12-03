<TITLE>
_step
</TITLE>

<METADATA>
env: Server Only
</METADATA>

<DESCRIPTION>
The `_step` operator returns the response value from a previously executed step in an API routine. This operator enables sequential data flow where later steps can use results from earlier steps.

**Key Features:**

- Access responses from any preceding step by its ID
- Dot notation supported for accessing nested properties
- Array indexes supported for accessing specific elements
- Returns `null` if the step hasn't executed or is still running

This operator is essential for building complex API workflows where operations depend on previous results, such as:

- Using an inserted document's ID in subsequent operations
- Chaining database queries based on earlier results
- Building multi-step data processing pipelines
  </DESCRIPTION>

<SCHEMA>
```yaml
_step:
  type: string
  description: |
    The step ID to retrieve the response from.
    Use dot notation to access nested properties (e.g., "get_user.profile.name").
    Use array indexes to access specific elements (e.g., "get_items.0.name").
  returns: any
```
</SCHEMA>

<EXAMPLES>

###### Example 1: Basic step chaining

Use the result of one step in subsequent steps.

```yaml
id: create-order-with-items
type: Api
routine:
  - id: create_order
    type: MongoDBInsertOne
    connectionId: orders
    properties:
      doc:
        customer_id:
          _payload: customer_id
        status: pending
        created_at:
          _date: now

  - id: add_order_items
    type: MongoDBInsertMany
    connectionId: order_items
    properties:
      docs:
        _array.map:
          - _payload: items
          - _function:
              order_id:
                _step: create_order.insertedId
              product_id: __args.0.product_id
              quantity: __args.0.quantity
              price: __args.0.price

  - :return:
      order_id:
        _step: create_order.insertedId
      items_added:
        _array.length:
          _step: add_order_items.insertedIds
```

---

###### Example 2: Accessing nested step properties

Navigate complex response structures with dot notation.

```yaml
id: get-user-with-orders
type: Api
routine:
  - id: get_user
    type: MongoDBFindOne
    connectionId: users
    properties:
      query:
        _id:
          _payload: user_id

  - id: get_recent_orders
    type: MongoDBFind
    connectionId: orders
    properties:
      query:
        customer_id:
          _step: get_user._id
        created_at:
          $gte:
            _date.subtract:
              - _date: now
              - 30
              - days
      options:
        sort:
          created_at: -1
        limit: 10

  - id: get_order_stats
    type: MongoDBAggregation
    connectionId: orders
    properties:
      pipeline:
        - $match:
            customer_id:
              _step: get_user._id
        - $group:
            _id: null
            total_orders:
              $sum: 1
            total_spent:
              $sum: $total

  - :return:
      user:
        id:
          _step: get_user._id
        name:
          _step: get_user.name
        email:
          _step: get_user.email
        member_since:
          _step: get_user.created_at
      recent_orders:
        _step: get_recent_orders
      statistics:
        order_count:
          _step: get_order_stats.0.total_orders
        lifetime_value:
          _step: get_order_stats.0.total_spent
```

---

###### Example 3: Array index access

Access specific elements from array results.

```yaml
id: process-top-products
type: Api
routine:
  - id: get_top_products
    type: MongoDBAggregation
    connectionId: products
    properties:
      pipeline:
        - $match:
            active: true
        - $sort:
            sales_count: -1
        - $limit: 5

  - id: feature_top_product
    type: MongoDBUpdateOne
    connectionId: products
    properties:
      filter:
        _id:
          _step: get_top_products.0._id # First product in the list
      update:
        $set:
          featured: true
          featured_at:
            _date: now

  - :return:
      top_products:
        first:
          name:
            _step: get_top_products.0.name
          sales:
            _step: get_top_products.0.sales_count
        second:
          name:
            _step: get_top_products.1.name
          sales:
            _step: get_top_products.1.sales_count
        third:
          name:
            _step: get_top_products.2.name
          sales:
            _step: get_top_products.2.sales_count
      featured_product_id:
        _step: get_top_products.0._id
```

---

###### Example 4: Multi-step data pipeline

Build a complete data processing pipeline with step dependencies.

```yaml
id: generate-invoice
type: Api
routine:
  # Step 1: Get the order
  - id: get_order
    type: MongoDBFindOne
    connectionId: orders
    properties:
      query:
        _id:
          _payload: order_id

  # Step 2: Get customer details
  - id: get_customer
    type: MongoDBFindOne
    connectionId: customers
    properties:
      query:
        _id:
          _step: get_order.customer_id

  # Step 3: Get order items with product details
  - id: get_order_items
    type: MongoDBAggregation
    connectionId: order_items
    properties:
      pipeline:
        - $match:
            order_id:
              _step: get_order._id
        - $lookup:
            from: products
            localField: product_id
            foreignField: _id
            as: product
        - $unwind: $product
        - $project:
            product_name: $product.name
            quantity: 1
            unit_price: 1
            line_total:
              $multiply:
                - $quantity
                - $unit_price

  # Step 4: Calculate totals
  - id: calculate_totals
    type: MongoDBAggregation
    connectionId: order_items
    properties:
      pipeline:
        - $match:
            order_id:
              _step: get_order._id
        - $group:
            _id: null
            subtotal:
              $sum:
                $multiply:
                  - $quantity
                  - $unit_price
            item_count:
              $sum: $quantity

  # Step 5: Create invoice record
  - id: create_invoice
    type: MongoDBInsertOne
    connectionId: invoices
    properties:
      doc:
        order_id:
          _step: get_order._id
        customer:
          id:
            _step: get_customer._id
          name:
            _step: get_customer.name
          email:
            _step: get_customer.email
          billing_address:
            _step: get_customer.billing_address
        items:
          _step: get_order_items
        subtotal:
          _step: calculate_totals.0.subtotal
        tax:
          _product:
            - _step: calculate_totals.0.subtotal
            - 0.1
        total:
          _product:
            - _step: calculate_totals.0.subtotal
            - 1.1
        created_at:
          _date: now

  # Step 6: Update order with invoice reference
  - id: update_order
    type: MongoDBUpdateOne
    connectionId: orders
    properties:
      filter:
        _id:
          _step: get_order._id
      update:
        $set:
          invoice_id:
            _step: create_invoice.insertedId
          invoiced_at:
            _date: now

  - :return:
      invoice_id:
        _step: create_invoice.insertedId
      order_id:
        _step: get_order._id
      customer_name:
        _step: get_customer.name
      total:
        _product:
          - _step: calculate_totals.0.subtotal
          - 1.1
```

---

###### Example 5: Conditional step execution based on previous results

Use step results to control flow and make decisions.

```yaml
id: process-refund
type: Api
routine:
  # Get the order
  - id: get_order
    type: MongoDBFindOne
    connectionId: orders
    properties:
      query:
        _id:
          _payload: order_id

  # Validate order is eligible for refund
  - :if:
      _or:
        - _eq:
            - _step: get_order
            - null
        - _eq:
            - _step: get_order.status
            - refunded
        - _eq:
            - _step: get_order.status
            - cancelled
    :then:
      - :reject:
          error: Order not eligible for refund
          order_status:
            _step: get_order.status

  # Calculate refund amount based on order age
  - :set_state:
      refund_amount:
        _if:
          test:
            _lt:
              - _date.diffInDays:
                  - _date: now
                  - _step: get_order.created_at
              - 30
          then:
            _step: get_order.total # Full refund within 30 days
          else:
            _product:
              - _step: get_order.total
              - 0.8 # 80% refund after 30 days

  # Process refund with payment provider
  - id: process_payment_refund
    type: AxiosHttp
    connectionId: payment_gateway
    properties:
      method: POST
      url: /refunds
      data:
        payment_id:
          _step: get_order.payment_id
        amount:
          _state: refund_amount
        reason:
          _payload: reason

  # Update order status
  - id: update_order_status
    type: MongoDBUpdateOne
    connectionId: orders
    properties:
      filter:
        _id:
          _step: get_order._id
      update:
        $set:
          status: refunded
          refund:
            amount:
              _state: refund_amount
            original_total:
              _step: get_order.total
            refund_id:
              _step: process_payment_refund.refund_id
            processed_at:
              _date: now
            reason:
              _payload: reason

  # Create refund record
  - id: create_refund_record
    type: MongoDBInsertOne
    connectionId: refunds
    properties:
      doc:
        order_id:
          _step: get_order._id
        customer_id:
          _step: get_order.customer_id
        original_amount:
          _step: get_order.total
        refund_amount:
          _state: refund_amount
        payment_refund_id:
          _step: process_payment_refund.refund_id
        reason:
          _payload: reason
        processed_by:
          _user: id
        created_at:
          _date: now

  - :return:
      success: true
      refund_id:
        _step: create_refund_record.insertedId
      amount_refunded:
        _state: refund_amount
      order_id:
        _step: get_order._id
```

</EXAMPLES>
