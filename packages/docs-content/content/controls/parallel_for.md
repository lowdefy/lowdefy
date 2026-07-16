# :parallel_for

```
({:parallel_for: string, :in: any[], :do: routine}): void
```

The `:parallel_for` control executes a routine for each item in an array simultaneously. Each iteration has access to its array item through the [`_item`](/_item) operator using the key specified in `:parallel_for`.
Unlike sequential [`:for`](/:for), all iterations start at the same time, making it ideal for processing independent items where order doesn't matter.
The control waits for all iterations to complete before continuing, unless an error, rejection, or return occurs.

#### Keys

- `:parallel_for: string`: __Required__ - Used to define the key that can be used to access the value of the array item of the executing iteration.
- `:in: any`: __Required__ - Used to define the array of data to iterate over.
- `:do: routine`: __Required__ - Used to define the routine that will be executed for each array item in parallel.

#### Examples

###### Update Multiple Users
```yaml
- :parallel_for: user_id
  :in:
    _payload: user_ids
  :do:
    id: update_last_seen
    type: MongoDBUpdateOne
    connectionId: users
    properties:
      filter:
        _id:
          _item: user_id
      update:
        $set:
          last_seen:
            _date: now
```
