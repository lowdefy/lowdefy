<TITLE>
Stripe
</TITLE>

<DESCRIPTION>

[Stripe](https://stripe.com/) is a popular payment provider which allows you to accept payments, send payouts, and manage your business online.
The `Stripe` connector uses the official [Node.js client from Stripe](https://github.com/stripe/stripe-node).
In order to use the `Stripe` connection, you first need to create a [Stripe](https://stripe.com/) account and setup an API key.

> Secrets like API keys should be stored using the [`_secret`](operators/secret.md) operator.

### Properties

- `secretKey: string`: __Required__ - Stripe [secret key](https://stripe.com/docs/keys).
- `apiVersion: string`: Stripe API version to use. Defaults to the account-wide version.
- `timeout: number`: Timeout for requests to the Stripe API.
- `maxNetworkRetries: number`: Maximum number of times failed requests are repeated before throwing an error.
- `telemetry: boolean`: Whether to send telemetry data to Stripe (this is forwarded to the Stripe client library. Lowdefy does not receive any telemetry data from your Stripe connection.)

</DESCRIPTION>

<REQUESTS>

- StripeRequest

</REQUESTS>

<SCHEMA>

```js
export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Connection Schema - Stripe',
  type: 'object',
  required: ['secretKey'],
  properties: {
    secretKey: {
      type: 'string',
      description: 'Stripe secret key.',
      errorMessage: {
        type: 'Stripe connection property "secretKey" should be a string.',
      },
    },
    apiVersion: {
      type: 'string',
      description: 'Stripe API version to use.',
      default: null,
      errorMessage: {
        type: 'Stripe connection property "apiVersion" should be a string.',
      },
    },
    telemetry: {
      type: 'boolean',
      description: 'Allow Stripe to send latency telemetry.',
      default: true,
      errorMessage: {
        type: 'Stripe connection property "telemetry" should be a boolean.',
      },
    },
    timeout: {
      type: 'integer',
      description: 'Maximum time each request can take in ms.',
      default: 80000,
      errorMessage: {
        type: 'Stripe connection property "timeout" should be an integer.',
      },
    },
    maxNetworkRetries: {
      type: 'integer',
      description: 'The amount of times a request should be retried.',
      default: 0,
      errorMessage: {
        type: 'Stripe connection property "maxNetworkRetries" should be an integer.',
      },
    },
  },
  errorMessage: {
    type: 'Stripe connection properties should be an object.',
    required: {
      secretKey: 'Stripe connection should have required property "secretKey".',
    },
  },
};
```

</SCHEMA>

<EXAMPLES>

### Simple connection

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

### Using an older API version

```yaml
connections:
  - id: stripe
    type: Stripe
    properties:
      secretKey:
        _secret: STRIPE_SECRET_KEY
      apiVersion: 2017-12-14
```

Environment variables:

```
LOWDEFY_SECRET_STRIPE_SECRET_KEY = sk_test_KyvNyie...
```

</EXAMPLES>
