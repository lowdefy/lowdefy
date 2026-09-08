# :reject

```
({:reject: string, :cause: any}): void
```

The `:reject` control is used to return a user-friendly error to the client when validation fails or business rules are violated.
Unlike [`:throw`](/:throw), which indicates a system error, `:reject` represents an expected failure condition that should be communicated to the user.
The control immediately stops routine execution and returns with a `"reject"` status.
Importantly, `:reject` does not trigger `:catch` blocks in [`:try`](/:try) statements, making it ideal for handling validation and business logic errors separately from system errors.

#### Keys

- `:reject: string`: __Required__ - The error message that will be returned in the response object of the API call result.
- `:cause: any`: Additional metadata that will be returned with the error message.

#### Examples

###### Example

```yaml
- id: check_inventory
  type: MongoDBFindOne
  connectionId: products
  properties:
    query:
      product_id:
        _payload: product_id
- :if:
    _lt:
      - _step: check_inventory.quantity
      - _payload: requested_quantity
  :then:
    :reject:
      _string.concat:
        - "Insufficient inventory. Only "
        - _step: check_inventory.quantity
        - " items available"
```

###### Reject with Additional Context

```yaml
- :if:
    _not:
      _step: get_user.email_verified
  :then:
    :reject: "Please verify your email before proceeding"
    :cause:
      user_id:
        _step: get_user._id
      email:
        _step: get_user.email
      account_created_at:
        _step: get_user.created_at
```
