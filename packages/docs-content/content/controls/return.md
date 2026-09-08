# :return

```
({:return: any}): void
```

The `:return` control immediately ends the execution of an API endpoint routine and returns a successful response with the specified data.
Any routine steps after a `:return` are not executed. The control accepts any value type (objects, arrays, strings, numbers, null) and marks the API call as successful.
When used within conditional controls like [`:if`](/:if) or [`:switch`](/:switch), it provides a way to exit early with a success status and return data to the client.

The `:return` control also works in client [event action lists](/events-and-actions) — it ends the whole event successfully, the event's `catch` actions do not run, and any actions after it are recorded as skipped. Inside a `catch` action list, `:return` ends the remaining catch actions the same way, but the event keeps its error result — `success` stays `false`.

#### Keys

- `:return: any`: __Required__ - The value that will be returned in the response object of the API call result.

#### Examples

###### Return Step Result

```yaml
- id: get_company
  type: MongoDBInsertOne
  connectionId: companies
  properties:
    doc:
      _id:
        _payload: company_id
- :return:
    _step: get_company
```

###### Switch with multiple returns

```yaml
- id: get_user_subscription
  type: MongoDBFindOne
  connectionId: subscriptions
  properties:
    query:
      user_id:
        _user: id
- :switch:
    - :case:
        _not:
          _step: get_user_subscription
      :then:
        :return:
          plan: "free"
          features: ["basic_access"]
          limit: 10
    - :case:
        _eq:
          - _step: get_user_subscription.type
          - "premium"
      :then:
        :return:
          plan: "premium"
          features: ["full_access", "priority_support", "api_access"]
          limit: -1
  :default:
    :return:
      plan: "standard"
      features: ["standard_access", "email_support"]
      limit: 100
```
