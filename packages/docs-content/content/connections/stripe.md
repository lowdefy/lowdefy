# Stripe

## Connections

Connection types:
  - Stripe

### Stripe

[Stripe](https://stripe.com/) is a popular payment provider which allows you to accept payments, send payouts, and manage your business online.
The `Stripe` connector uses the official [Node.js client from Stripe](https://github.com/stripe/stripe-node).
In order to use the `Stripe` connection, you first need to create a [Stripe](https://stripe.com/) account and setup an API key.

> Secrets like API keys should be stored using the [`_secret`](operators/secret.md) operator.

#### Properties
- `secretKey: string`: __Required__ - Stripe [secret key](https://stripe.com/docs/keys).
- `apiVersion: string`: Stripe [API version](https://docs.stripe.com/api/versioning) to use, for example `'2023-10-16'`. Defaults to the version the Stripe Node.js client is pinned to (`2026-10-28.endive` for the client Lowdefy ships), not your account's default version. That version moves forward when Lowdefy updates the client to a new major version, and the request parameters and response fields Stripe uses change with it, so set `apiVersion` to keep a fixed version across Lowdefy upgrades.
- `timeout: number`: Timeout for requests to the Stripe API in milliseconds. Defaults to `80000`.
- `maxNetworkRetries: number`: Maximum number of times failed requests are repeated before throwing an error. Defaults to `2`.
- `telemetry: boolean`: Whether to send telemetry data to Stripe (this is forwarded to the Stripe client library. Lowdefy does not receive any telemetry data from your Stripe connection.)

#### Examples

###### Simple connection:
```yaml
connections:
  - id: stripe
    type: Stripe
    properties:
      secretKey:
        _secret: STRIPE_SECRET_KEY
```
Environment variables:
```
LOWDEFY_SECRET_STRIPE_SECRET_KEY = sk_test_KyvNyie...
```

###### Using a fixed API version:
```yaml
connections:
  - id: stripe
    type: Stripe
    properties:
      secretKey:
        _secret: STRIPE_SECRET_KEY
      apiVersion: '2023-10-16'
```
Quote the version, so YAML reads it as a string and not a date.
Environment variables:
```
LOWDEFY_SECRET_STRIPE_SECRET_KEY = sk_test_KyvNyie...
```

## Requests

Request types:
  - StripeRequest

### StripeRequest

The `StripeRequest` request allows calls to all modules supported by the [Stripe API client](https://stripe.com/docs/api?lang=node) by nesting the resource and method calls:
```yaml
resource:
  method:
    - parameter1
    - parameter2
```

#### Properties
- `{{ apiResource }}: object`: A Stripe API resource, eg. `customers`.
  - `{{ method }}: array | null`: A resource method, eg. `create`. The arguments array will be passed on to the client method.

The Stripe client exposes all resources as objects, with the API methods being available as function properties on those resource objects.
In Lowdefy, you may access these properties by nesting them.

The arguments follow the order of the client method: an ID first where the method takes one (`retrieve`, `update`), then the request parameters, then the [request options](https://github.com/stripe/stripe-node#per-request-configuration) (`stripeAccount`, `idempotencyKey`, `apiVersion`, `apiKey`). Request options are only read from the argument after the parameters; put `null` in place of the parameters when you only pass options.

### Examples

###### List the 30 most recent customers
```yaml
requests:
  - id: list_customers
    type: StripeRequest
    connectionId: stripe
    properties:
      customers:
        list:
          - limit: 30
```

###### Create a payment intent
```yaml
requests:
  - id: create_payment_intent
    type: StripeRequest
    connectionId: stripe
    properties:
      paymentIntents:
        create:
          - amount: 2000
            currency: eur
            allowed_payment_method_types: [ card ]
```

###### Retrieve a checkout session by ID
```yaml
requests:
  - id: retrieve_checkout_session
    type: StripeRequest
    connectionId: stripe
    properties:
      checkout:
        sessions:
          retrieve:
            - cs_test_onpT2icY2lrSU0IgDGXEhhcOHcWeJS5BpLcQGMx0uI9TZHLMBdzvWpvx
```

###### List the customers of a connected account
```yaml
requests:
  - id: list_connected_customers
    type: StripeRequest
    connectionId: stripe
    properties:
      customers:
        list:
          - limit: 10
          - stripeAccount: acct_1032D82eZvKYlo2C
```
