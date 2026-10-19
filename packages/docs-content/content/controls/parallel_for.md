# :parallel_for

```
({:parallel_for: string, :in: any[], :do: routine, :concurrency?: integer}): void
```

The `:parallel_for` control executes a routine for each item in an array simultaneously. Each iteration has access to its array item through the [`_item`](/_item) operator using the key specified in `:parallel_for`.
Unlike sequential [`:for`](/:for), all iterations start at the same time, making it ideal for processing independent items where order doesn't matter.
Set `:concurrency` to run at most that many iterations at once: the next item starts when one finishes. Use it when every iteration calls a rate-limited service (an AI or enrichment API), so a large array does not send hundreds of calls at the same moment.
The control waits for all iterations to complete before continuing. Every item runs, with or without `:concurrency`; then the first error, else the first rejection, else the first return (in item order) ends the control with that result.

#### Keys

- `:parallel_for: string`: __Required__ - Used to define the key that can be used to access the value of the array item of the executing iteration.
- `:in: any`: __Required__ - Used to define the array of data to iterate over.
- `:do: routine`: __Required__ - Used to define the routine that will be executed for each array item in parallel.
- `:concurrency: integer`: The maximum number of iterations running at once, a positive integer (operators allowed, for example `_payload`). Without it every iteration starts at once.

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

###### Call a rate-limited API, five domains at a time
```yaml
- :parallel_for: domain
  :in:
    _payload: domains
  :concurrency: 5
  :do:
    id: lookup
    type: AxiosHttp
    connectionId: company_api
    properties:
      url: /lookup
      params:
        domain:
          _item: domain
```
