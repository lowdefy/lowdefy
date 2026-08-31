# _step

```
(stepId: string): any
```

The `_step` operator returns the response value from a previously executed step in an API routine. This operator is only available within API routines and allows later steps to access data from earlier steps. If the step has not yet been executed or is still executing, the returned value is `null`. Dot notation and array indexes are supported for accessing nested properties. A dot is always a separator unless it is escaped with `\.`, which makes it a literal character in the key — `a\.b` reads the key `a.b`; inside a double-quoted YAML string the escape must be written `\\.`. On an unescaped path each segment is tried as a plain key first, and a plain key that is present always wins: a nested `a.b.c` shadows a literal `a.b` key, and a present `a` blocks the literal key even when it holds a string or number rather than an object. A literal dotted key is only reached where the plain key is absent, so escape it to address one reliably.

#### Arguments

###### string
The id of a step that has already been executed in the current API routine.

#### Examples

###### Using a step response:
```yaml
routine:
  - id: get_user
    type: MongoDBFindOne
    connectionId: users
    properties:
      query:
        email:
          _payload: email

  - :return:
      _step: get_user
```
Returns: The complete response object returned by the `get_user` step.

###### Using dot notation to access nested properties:
```yaml
routine:
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
          _step: get_user._id  # Access the _id field from get_user
```

###### Using array indexes:
```yaml
routine:
  - id: get_products
    type: MongoDBFind
    connectionId: products
    properties:
      query:
        category: 'electronics'

  - :return:
      first_product:
        _step: get_products.0  # Access the first element of the array
      first_product_name:
        _step: get_products.0.name  # Access a property of the first element
```

###### Chaining multiple steps:
```yaml
routine:
  - id: create_order
    type: MongoDBInsertOne
    connectionId: orders
    properties:
      doc:
        items:
          _payload: items
        total:
          _payload: total

  - id: send_confirmation
    type: SendGridMail
    connectionId: email-service
    properties:
      to:
        _payload: customer_email
      template_data:
        order_id:
          _step: create_order.insertedId  # Use the inserted document's ID

  - :return:
      success: true
      order_id:
        _step: create_order.insertedId
      email_sent:
        _step: send_confirmation.success
```
