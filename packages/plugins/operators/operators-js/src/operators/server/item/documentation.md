<TITLE>_item</TITLE>
<METADATA>env: Server</METADATA>
<DESCRIPTION>The `_item` operator returns the current item value during iteration in [`:for`](/:for) and [`:parallel_for`](/:parallel_for) loop control structures within API routines.
The key used with `_item` must match the key defined in the relevant loop control declaration because it also supports nested loops.
Dot notation is supported for accessing nested properties.</DESCRIPTION>
<USAGE>(key: string): any ###### string The key name defined in the relevant loop control structure.</USAGE>
<EXAMPLES>###### Using in a :for loop:
```yaml
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
              _item: user_id  # Access the current user_id
          update:
            $set:
              last_seen:
                _date: now
```
Returns: The current value from the array being iterated over.

###### Using dot notation to access nested properties:

```yaml
routine:
  - :for: product
    :in:
      _payload: products # Array of product objects
    :do:
      - id: update_product
        type: MongoDBUpdateOne
        connectionId: products
        properties:
          filter:
            _id:
              _item: product._id # Access the _id field of current product
          update:
            $set:
              name:
                _item: product.name
              price:
                _item: product.price
              category:
                _item: product.category
              last_updated:
                _date: now

      - :log:
          message: 'Processing product'
          product_name:
            _item: product.name
          product_sku:
            _item: product.sku
```

###### Using in :parallel_for loop for concurrent processing:

```yaml
routine:
  - id: get_orders
    type: MongoDBFind
    connectionId: orders
    properties:
      query:
        status: 'pending'

  - :parallel_for: order
    :in:
      _step: get_orders
    :do:
      - id: send_notification
        type: SendGridMail
        connectionId: email-service
        properties:
          to:
            _item: order.customer_email
          template_id: 'order_confirmation'
          dynamic_template_data:
            order_id:
              _item: order._id
            total:
              _item: order.total
            items:
              _item: order.items
```

###### Nested loops with multiple \_item references:

```yaml
routine:
  - :for: category
    :in:
      _payload: categories
    :do:
      - :for: product
        :in:
          _item: category.products # Access products array from outer loop item
        :do:
          - id: update_product
            type: MongoDBUpdateOne
            connectionId: products
            properties:
              filter:
                _id:
                  _item: product._id
              update:
                $set:
                  category_name:
                    _item: category.name # Access outer loop item
                  category_id:
                    _item: category._id
                  product_rank:
                    _item: product.rank # Access inner loop item
```

###### Accumulating values with \_item:

````yaml
routine:
  - :set_state:
      total: 0
      processed_count: 0

  - :for: item
    :in:
      _payload: order_items
    :do:
      - :set_state:
          total:
            _sum:
              - _state: total
              - _product:
                  - _item: item.price
                  - _item: item.quantity
          processed_count:
            _sum:
              - _state: processed_count
              - 1

      - :log:
          processing_item:
            _item: item.name
          item_total:
            _product:
              - _item: item.price
              - _item: item.quantity

  - :return:
      total:
        _state: total
      items_processed:
        _state: processed_count
```</EXAMPLES>
````
