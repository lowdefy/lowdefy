# _credential

```
(value: any): any
```

The `_credential` operator marks a value a routine makes at runtime as a credential, and returns it unchanged. Use it for a new API key, a token, or a secret derived with [`_hmac`](/_hmac): values the server does not hold as a [`_secret`](/_secret), so the log scrub would not know them.

For the rest of the request, every server log line and Sentry event shows `[REDACTED]` in place of the value, including the debug lines that print `:set_state`, `:return`, step results and an error's `received`, and the request's Sentry transaction, which is sent after the response. An endpoint the routine calls through a `CallApi` step with `detached: true` runs as a new request, and its logs scrub the values the dispatcher marked before the call too. The routine still uses the real value, and the caller still gets it. Marked values are scrubbed on the development server too, which otherwise logs secrets in full.

Every string in the value is marked, so one `_credential` can wrap an object holding several. Strings shorter than 8 characters are not scrubbed, as with secrets. Wrap the value where it is made: a line logged before it is marked still holds it.

#### Arguments

###### any
The value to mark and return.

#### Examples

###### Return a new API key once, without it reaching the logs:
```yaml
- ':set_state':
    key:
      _credential:
        _string.concat:
          - sk_
          - _uuid: true
- id: save_key_hash
  type: MongoDBUpdateOne
  connectionId: apps
  properties:
    filter:
      _id:
        _payload: app_id
    update:
      $set:
        key_hash:
          _hash.sha256:
            _state: key
- ':return':
    key:
      _state: key
```
Returns: `{ key: "sk_..." }` to the caller. The debug lines for `:set_state` and `:return` show `[REDACTED]`.

###### Mark a secret derived from a root secret:
```yaml
_credential:
  _hmac.sha256:
    key:
      _secret: SUPPORT_ROOT_SECRET
    data:
      _string.concat:
        - 'app:'
        - _payload: app_id
```
Returns: The hex HMAC, which the server logs as `[REDACTED]`.
