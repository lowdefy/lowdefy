<TITLE>
StripeRequest
</TITLE>

<DESCRIPTION>

The `StripeRequest` request allows calls to all modules supported by the [Stripe API client](https://stripe.com/docs/api?lang=node) by nesting the resource and method calls:
```yaml
resource:
  method:
    - parameter1
    - parameter2
```

### Properties

- `{{ apiResource }}: object`: A Stripe API resource, eg. `customers`.
  - `{{ method }}: array | null`: A resource method, eg. `create`. The arguments array will be passed on to the client method.

The Stripe client exposes all resources as objects, with the API methods being available as function properties on those resource objects.
In Lowdefy, you may access these properties by nesting them.

</DESCRIPTION>

<CONNECTION>
Stripe
</CONNECTION>

<SCHEMA>

```js
export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - StripeRequest',
  type: 'object',
  patternProperties: {
    '.+': {
      description: 'Stripe API resource',
      type: 'object',
      minProperties: 1,
      maxProperties: 1,
      errorMessage: {
        type: 'StripeRequest resource should be an object.',
        minProperties: 'StripeRequest resource should contain a method to call.',
        maxProperties: 'StripeRequest resource should contain only a single method to call.',
        oneOf:
          'StripeRequest resource should only contain a method to call, or sub-resource with a method to call.',
      },
      oneOf: [
        {
          description: 'Stripe API method to call on the resource',
          patternProperties: {
            '.+': {
              description: 'Parameters to pass to the resource method, if any',
              type: ['array', 'null'],
              errorMessage: {
                type: 'Should be an array of parameters or null.',
              },
            },
          },
        },
        {
          description: 'Stripe API sub-resource of the parent resource',
          patternProperties: {
            '.+': {
              description: 'Stripe API method to call on the resource',
              type: 'object',
              minProperties: 1,
              maxProperties: 1,
              patternProperties: {
                '.+': {
                  description: 'Parameters to pass to the sub-resource method, if any',
                  type: ['array', 'null'],
                },
              },
            },
          },
        },
      ],
    },
  },
  minProperties: 1,
  maxProperties: 1,
  errorMessage: {
    type: 'StripeRequest request properties should be an object.',
    additionalProperties: 'StripeRequest should contain a valid resource to call.',
    minProperties: 'StripeRequest should contain a resource to call.',
    maxProperties: 'StripeRequest should contain only a single resource to call.',
  },
};
```

</SCHEMA>

<EXAMPLES>

### List the 30 most recent customers

```yaml
requests:
  - id: list_customers
    type: StripeRequest
    connectionId: stripe
    properties:
      customers:
        list:
          limit: 30
```

### Create a payment intent

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
            payment_method_types: [ card ]
```

### Retrieve a checkout session by ID

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

</EXAMPLES>
