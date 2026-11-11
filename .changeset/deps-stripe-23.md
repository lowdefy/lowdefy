---
'@lowdefy/connection-stripe': minor
---

fix(deps): Update stripe to 23.1.0

Updates the Stripe connection's Node.js client from 14.5.0 to 23.1.0. This also fixes `StripeRequest`, which could not find any Stripe method (every request failed with `Invalid Stripe method <resource>.<method>`), so Stripe requests work again.

Check your app if it has a `Stripe` connection. The changes below need config changes:

- **The default Stripe API version changes from `2023-10-16` to `2026-10-28.endive`.** This only affects connections that do not set `apiVersion`. Between those versions Stripe removed and renamed request parameters and response fields. For example, `payment_method_types` on Checkout Sessions, PaymentIntents and SetupIntents is now `allowed_payment_method_types`, `current_period_start` and `current_period_end` moved from subscriptions to subscription items, and invoices no longer have `charge`, `payment_intent` or `subscription`. To keep the API version your app uses today, set it on the connection:

  ```yaml
  connections:
    - id: stripe
      type: Stripe
      properties:
        secretKey:
          _secret: STRIPE_SECRET_KEY
        apiVersion: '2023-10-16'
  ```

  Quote the version, so YAML reads it as a string and not a date. To move to the new version instead, work through the [Stripe API changelog](https://docs.stripe.com/changelog) from `2023-10-16` onwards.

- **Four methods were removed from the client**, whatever `apiVersion` you set. `invoices.retrieveUpcoming` and `invoices.listUpcomingLines` are replaced by `invoices.createPreview`. `subscriptionItems.createUsageRecord` and `subscriptionItems.listUsageRecordSummaries` are replaced by billing meters (`billing.meterEvents.create`). Requests that use them now fail with `Invalid Stripe method`.

- **Request options are only read from the argument after the parameters.** Search your requests for `stripeAccount`, `idempotencyKey`, `apiKey` or a per-request `apiVersion`. Pass them as their own argument after the parameters, and use `null` in place of the parameters when there are none:

  ```yaml
  customers:
    list:
      - null
      - stripeAccount: acct_123
  ```

  An options object passed as the only argument, or options mixed into the parameters, is now sent to Stripe as parameters and Stripe rejects the request. Passing a secret key as a plain string argument is no longer supported; use `apiKey` in the options instead.

- **Failed requests are retried up to 2 times, not 1,** when the connection does not set `maxNetworkRetries`. Set `maxNetworkRetries` on the connection to choose another number.

The connection's `apiVersion` and `maxNetworkRetries` descriptions now give the real defaults. `*_decimal` fields in responses are still returned as strings.
