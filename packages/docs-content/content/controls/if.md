# :if

```
({:if: boolean, :then: routine, :else: routine}): void
```

The `:if` control executes different routines based on a boolean condition. It evaluates the condition and runs the `:then` branch if true, or the optional `:else` branch if false. Generally other operators are used to evaluate the test.

The `:if` control also works in client [event action lists](/events-and-actions) — there each branch is a list of actions, and the same syntax and semantics apply.

The condition uses JS truthiness — any truthy value takes the `:then` branch. This differs from an action's `skip` field, which only skips when it evaluates to exactly `true`.

#### Keys

- `:if: boolean`: __Required__ - The boolean result of a test or value.
- `:then: routine`: __Required__ - The routine to execute if the test result is true.
- `:else: routine`: The routine to execute if the test result is false.

#### Examples

###### Simple Example
```yaml
routine:
  - :if: true
    :then:
      :log: 'Test was true'
    :else:
      :log: 'Test was false'
```
Logs:
`Test was true`

###### Set User Features
```yaml
routine:
  - :if:
      _eq:
        - _payload: user_type
        - 'premium'
    :then:
      - :set_state:
          discount: 0.2
          features: ['unlimited', 'priority_support']
    :else:
      - :set_state:
          discount: 0
          features: ['basic']
```

###### Optional Fraud Check

```yaml
routines:
  - :if:
      _gte:
        - _payload: order_amount
        - 1000
    :then:
      - :log: 'High-value order detected, applying fraud checks'
      - id: fraud_check
        type: FraudDetectionAPI
        connectionId: fraud-service
        properties:
          amount:
            _payload: order_amount
          customer_id:
            _payload: customer_id
      - :if:
          _gt:
            - _step: fraud_check.risk_score
            - 0.7
        :then:
          :reject: 'Order flagged for manual review'
  - id: create_payment_intent
    type: StripeRequest
    connectionId: stripe
    properties:
      paymentIntents:
        create:
          - amount: 2000
            currency: eur
            payment_method_types: ['card']
```

###### In a client event action list

```yaml
events:
  onClick:
    - :if:
        _not:
          _state: skip_reopen
      :then:
        - id: reopen_ticket
          type: Request
          params: reopen_ticket
        - id: redirect
          type: Link
          params:
            pageId: ticket-view
      :else:
        - id: show_blocked
          type: DisplayMessage
          params:
            content: Ticket cannot be reopened.
            status: warning
```
