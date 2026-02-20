# @lowdefy/connection-stripe

[Stripe](https://stripe.com/docs/api) payment connection for Lowdefy.

## Connection Type

| Type | Purpose |
|------|---------|
| `Stripe` | Connect to Stripe API |

## Connection Configuration

```yaml
connections:
  - id: stripe
    type: Stripe
    properties:
      secretKey:
        _secret: STRIPE_SECRET_KEY
```

## Request Types

| Type | Purpose |
|------|---------|
| `StripeRequest` | Generic Stripe API call |

## Making Stripe API Calls

```yaml
requests:
  - id: createCustomer
    type: StripeRequest
    connectionId: stripe
    properties:
      resource: customers
      method: create
      params:
        email:
          _state: email
        name:
          _state: name
```

## Common Operations

### Create Payment Intent

```yaml
requests:
  - id: createPayment
    type: StripeRequest
    connectionId: stripe
    properties:
      resource: paymentIntents
      method: create
      params:
        amount: 2000    # $20.00 in cents
        currency: usd
        customer:
          _state: customerId
```

### List Customers

```yaml
requests:
  - id: getCustomers
    type: StripeRequest
    connectionId: stripe
    properties:
      resource: customers
      method: list
      params:
        limit: 10
```

### Create Subscription

```yaml
requests:
  - id: subscribe
    type: StripeRequest
    connectionId: stripe
    properties:
      resource: subscriptions
      method: create
      params:
        customer:
          _state: customerId
        items:
          - price:
              _state: priceId
```

## Webhook Handling

Stripe webhooks can be handled via custom API endpoints. Verify signatures server-side for security.
