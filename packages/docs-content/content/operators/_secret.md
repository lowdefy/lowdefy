# _secret

```
(key: string): any
(arguments: {
  key?: string,
  default?: any
}): any
```

There is no way to read the whole `secrets` object: `_secret: true` and `_secret: { all: true }` are rejected, so a single mistake cannot leak every secret the app holds.

The `_secret` operator gets a value from the [`secret`](/context-and-secret) object. The `secrets` is a data object that contains sensitive information like passwords or API keys. The `_secret` operator can only be used in `connections` and `requests`. Secrets are read from environment variables on the server that start with `LOWDEFY_SECRET_`, (i.e. `LOWDEFY_SECRET_SECRET_NAME`). The name of the secret is the part after `LOWDEFY_SECRET_`. Since environment variables can only be strings, secrets can be JSON encoded, and parsed using the [`_json.parse`](/_json) method.

#### Arguments

###### string
If the `_secret` operator is called with a string argument, the value of the key in the `secrets` object is returned. If the value is not found, `null` is returned.

###### object
  - `key: string`: The value of the key in the `secrets` object is returned. If the value is not found, `null`, or the specified default value is returned.
  - `default: any`: A value to return if the `key` is not found in `secrets`. By default, `null` is returned if a value is not found.

#### Examples

###### Get the value of `MY_SECRET` from `secrets`:
```yaml
_secret: MY_SECRET
```
```yaml
_secret:
  key: MY_SECRET
```
Returns: The value of `MY_SECRET` in `secrets`.

###### Return a default value if the value is not found:
```yaml
_secret:
  key: MY_SECRET
  default: Not so secret
```
Returns: The value of `MY_SECRET`, or `"Not so secret"`.
