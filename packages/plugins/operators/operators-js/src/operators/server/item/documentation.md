<TITLE>
_item
</TITLE>

<METADATA>
env: Server Only
</METADATA>

<DESCRIPTION>
The `_item` operator returns the current item value during iteration in [`:for`](/:for) and [`:parallel_for`](/:parallel_for) loop control structures within API routines. This operator provides access to each element as you iterate through an array.

**Key Features:**

- The key used with `_item` must match the key defined in the loop declaration (e.g., `:for: user` means using `_item: user`)
- Supports nested loops - each loop level has its own item key
- Dot notation is supported for accessing nested properties within the item
- Available only within the `:do` block of for-loops in API routines

This operator is essential for batch processing, bulk updates, and iterating over collections in server-side operations.
</DESCRIPTION>

<SCHEMA>
```yaml
_item:
  type: string
  description: |
    The key name defined in the relevant loop control structure.
    Use dot notation to access nested properties (e.g., "product.name", "order.items.0.price").
  returns: any
```
</SCHEMA>

<EXAMPLES>

###### Example 1: Basic iteration over an array

Update multiple records with a simple for loop.

```yaml
id: update-user-status
type: Api
routine:
  - :for: user_id
    :in:
      _payload: user_ids
    :do:
      - id: update_user
        type: MongoDBUpdateOne
        connectionId: users
        properties:
          filter:
            _id:
              _item: user_id
          update:
            $set:
              status: active
              updated_at:
                _date: now

  - :return:
      success: true
      updated_count:
        _array.length:
          _payload: user_ids
```

---

###### Example 2: Accessing nested properties

Process complex objects with dot notation.

```yaml
id: process-order-items
type: Api
routine:
  - :set_state:
      total: 0

  - :for: item
    :in:
      _payload: order.items
    :do:
      - id: update_inventory
        type: MongoDBUpdateOne
        connectionId: products
        properties:
          filter:
            _id:
              _item: item.product_id
          update:
            $inc:
              stock:
                _product:
                  - _item: item.quantity
                  - -1

      - :set_state:
          total:
            _sum:
              - _state: total
              - _product:
                  - _item: item.quantity
                  - _item: item.unit_price

      - :log:
          processed_item:
            product_id:
              _item: item.product_id
            quantity:
              _item: item.quantity
            line_total:
              _product:
                - _item: item.quantity
                - _item: item.unit_price

  - :return:
      order_total:
        _state: total
      items_processed:
        _array.length:
          _payload: order.items
```

---

###### Example 3: Parallel processing with \_parallel_for

Process items concurrently for better performance.

```yaml
id: send-bulk-notifications
type: Api
routine:
  - id: get_recipients
    type: MongoDBFind
    connectionId: users
    properties:
      query:
        notifications_enabled: true
        status: active

  - :parallel_for: recipient
    :in:
      _step: get_recipients
    :do:
      - id: send_email
        type: AxiosHttp
        connectionId: email_service
        properties:
          method: POST
          url: /send
          data:
            to:
              _item: recipient.email
            name:
              _item: recipient.name
            template_id: notification_template
            dynamic_data:
              user_name:
                _item: recipient.name
              notification_type:
                _payload: notification_type

      - id: log_notification
        type: MongoDBInsertOne
        connectionId: notification_logs
        properties:
          doc:
            recipient_id:
              _item: recipient._id
            email:
              _item: recipient.email
            type:
              _payload: notification_type
            sent_at:
              _date: now
            status: sent

  - :return:
      success: true
      notifications_sent:
        _array.length:
          _step: get_recipients
```

---

###### Example 4: Nested loops with multiple item references

Process hierarchical data with nested iterations.

```yaml
id: import-categories-with-products
type: Api
routine:
  - :for: category
    :in:
      _payload: categories
    :do:
      - id: insert_category
        type: MongoDBInsertOne
        connectionId: categories
        properties:
          doc:
            name:
              _item: category.name
            description:
              _item: category.description
            created_at:
              _date: now

      - :for: product
        :in:
          _item: category.products
        :do:
          - id: insert_product
            type: MongoDBInsertOne
            connectionId: products
            properties:
              doc:
                name:
                  _item: product.name
                sku:
                  _item: product.sku
                price:
                  _item: product.price
                category_id:
                  _step: insert_category.insertedId
                category_name:
                  _item: category.name # Access outer loop item
                created_at:
                  _date: now

          - :log:
              imported_product:
                category:
                  _item: category.name
                product:
                  _item: product.name
                product_id:
                  _step: insert_product.insertedId

  - :return:
      success: true
      categories_imported:
        _array.length:
          _payload: categories
```

---

###### Example 5: Data aggregation and transformation

Accumulate values while iterating through records.

```yaml
id: generate-monthly-report
type: Api
routine:
  - id: get_transactions
    type: MongoDBFind
    connectionId: transactions
    properties:
      query:
        date:
          $gte:
            _payload: start_date
          $lte:
            _payload: end_date
        status: completed

  - :set_state:
      summary:
        total_revenue: 0
        total_transactions: 0
        by_category: {}
        largest_transaction: null

  - :for: transaction
    :in:
      _step: get_transactions
    :do:
      - :set_state:
          summary:
            total_revenue:
              _sum:
                - _state: summary.total_revenue
                - _item: transaction.amount
            total_transactions:
              _sum:
                - _state: summary.total_transactions
                - 1
            largest_transaction:
              _if:
                test:
                  _or:
                    - _eq:
                        - _state: summary.largest_transaction
                        - null
                    - _gt:
                        - _item: transaction.amount
                        - _state: summary.largest_transaction.amount
                then:
                  _id:
                    _item: transaction._id
                  amount:
                    _item: transaction.amount
                  date:
                    _item: transaction.date
                else:
                  _state: summary.largest_transaction

      - :log:
          processing_transaction:
            id:
              _item: transaction._id
            amount:
              _item: transaction.amount
            running_total:
              _state: summary.total_revenue

  - id: save_report
    type: MongoDBInsertOne
    connectionId: reports
    properties:
      doc:
        type: monthly_summary
        period:
          start:
            _payload: start_date
          end:
            _payload: end_date
        summary:
          _state: summary
        generated_at:
          _date: now
        generated_by:
          _user: id

  - :return:
      report_id:
        _step: save_report.insertedId
      summary:
        _state: summary
```

</EXAMPLES>
