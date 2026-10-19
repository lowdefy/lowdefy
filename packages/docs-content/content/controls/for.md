# :for

```
({:for: string, :in: any[], :do: routine}): void
```

The `:for` control iterates over an array, executing a routine for each item sequentially.
The routine defined by the `:do` key is executed for each item within the array defined by the `:in` key. This routine is executed sequentially for each item in the array.
The value of the current array item can be accessed using the [`_item`](/_item) operator with the item key set by the `:for` key. This operator is only available within the `:for` and [`:parallel_for`](/:parallel_for) controls.

#### Keys

- `:for: string`: __Required__ - Used to define the key that can be used to access the value of the array item of the current iteration.
- `:in: array`: __Required__ - Used to define the array of data to iterate over.
- `:do: routine`: __Required__ - Used to define the routine that will be executed for each array item.

#### Examples

###### Simple Example
```yaml
- :for: count
  :in:
    - 1
    - 2
    - 3
  :do:
    :log:
      _item: count
```
Logs:
```
  1
  2
  3
```

###### Calculate Order Total
```yaml
- :set_state:
    order_total: 0

- :for: item
  :in:
    _payload: order_items
  :do:
    - :set_state:
        item_total:
          _math.multiply:
            - _item: item.price
            - _item: item.quantity

    - :set_state:
        order_total:
          _math.add:
            - _state: order_total
            - _state: item_total

    - :log:
        _string.concat:
          - _item: item.name
          - ' x '
          - _item: item.quantity
          - ' = $'
          - _state: item_total

- :return:
    total:
      _state: order_total
```

###### Setting Active Users in MongoDB
```yaml
- id: get_active_users
  type: MongoDBAggregation
  connectionId: activity-log
  properties:
    pipeline:
      - $match:
          $expr:
            $gte:
              - $timestamp
              - $dateTrunc:
                  date: $$NOW
                  unit: day
      - $group:
          _id: $user_id
- :for: user
  :in:
    _step: get_active_users
  :do:
    - id: update_user_status
      type: MongoDBUpdateOne
      connectionId: users
      properties:
        filter:
          _id:
            _item: user._id
        update:
          $set:
            last_processed:
              _date: now
            status: 'active'
```
