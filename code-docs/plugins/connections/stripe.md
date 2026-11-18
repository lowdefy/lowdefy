# @lowdefy/connection-stripe

[Stripe](https://stripe.com/docs/api) payment connection for Lowdefy.

## Connection Type

| Type     | Purpose               |
| -------- | --------------------- |
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

| Type            | Purpose                 |
| --------------- | ----------------------- |
| `StripeRequest` | Generic Stripe API call |

## Making Stripe API Calls

The request properties are a path into the Stripe client, ending in an array of arguments for the method (or `null` for none). `StripeRequest` walks the path and calls the method with the arguments spread:

```yaml
requests:
  - id: createCustomer
    type: StripeRequest
    connectionId: stripe
    properties:
      customers: # stripe.customers
        create: # .create(params, options)
          - email:
              _state: email
            name:
              _state: name
```

Nested resources nest further (`checkout: { sessions: { retrieve: [id] } }`). Arguments follow the client method's order: an ID first where it takes one, then params, then request options (`stripeAccount`, `idempotencyKey`, ...). Since stripe-node 22 options are only read from the argument after params, so a call with options and no params passes `null` as the params.

`getStripeMethod` resolves the path. Resources are own properties of the client, but methods live on each resource's class prototype, which `@lowdefy/helpers` `get` does not read (it reads own properties only). It refuses `_`-prefixed SDK internals and `Object.prototype` members.

## API Version

`apiVersion` is passed to the client as is. When it is not set, the client uses the API version the installed stripe-node major is pinned to, so a major stripe-node update changes request params and response shapes for apps that do not set it. Changesets for those updates tell app authors to set `apiVersion` to keep the old behaviour.

Responses can hold `Stripe.Decimal` values (`*_decimal` fields, stripe-node 21+). They serialize to strings through their `toJSON`, as before. V2 (`v2.*`) responses can hold `BigInt` values for int64 fields, which the request response serializer cannot encode.

## Webhook Handling

Stripe webhooks can be handled via custom API endpoints. Verify signatures server-side for security.
