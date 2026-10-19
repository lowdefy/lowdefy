# Secrets

The `secrets` object is an object that can be used to securely store sensitive information such as passwords and API keys. Secrets can be accessed using the [`_secret`](/_secret) operator.

The secrets object only exists on the backend server, and therefore the `_secret` operator can only be used in `connections` and `requests`.

Secrets can be set by creating an environment variable prefixed with `LOWDEFY_SECRET_`. The secret will then be available in the secrets object with the remaining part of the name as key.

For example, if the environment variable `LOWDEFY_SECRET_MY_SECRET` is set to `supersecret`, then `_secret: MY_SECRET` will return `supersecret`.

To use secrets in the local development environment, environment variables can be set using a `.env` file. Create a file called `.env` at the root of the project directory, then set environment variables as follows:

```
# .env
LOWDEFY_SECRET_MY_SECRET=supersecret
```

## Module Secret Allowlist

Modules declare the secrets they require in their `module.lowdefy.yaml` manifest. Undeclared `_secret` references cause build errors.

When a module connection is remapped to an app connection, the module's secret references for that connection are skipped — the app connection handles its own secrets.

See [Modules](/modules) for full details.
