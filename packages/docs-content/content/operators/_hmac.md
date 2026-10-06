# _hmac

The `_hmac` operator computes an [HMAC](https://en.wikipedia.org/wiki/HMAC) of a string under a key, returned as lower-case hex. Use it to sign what a routine sends (a webhook signature header, for example) or to derive a secret from a root secret. The key is usually a [`_secret`](/_secret), so `_hmac` runs only on the server and never reaches the browser.

The output of one call works as the `key` of the next, so one root secret can derive a secret per app, and that secret can sign a message.

> This operator can be used as a [`_build`](/_build) operator method.

# Operator methods:

## _hmac.sha256

```
({ key: string, data: string }): string
```

The `_hmac.sha256` method computes the HMAC-SHA256 of `data` under `key`. Both are read as UTF-8 strings.

#### Arguments

###### object
  - `key: string`: __Required__ - The secret key.
  - `data: string`: __Required__ - The string to sign.

#### Examples

###### Sign a string:
```yaml
_hmac.sha256:
  key: my-secret
  data: Hello World!
```
Returns: `"ce334046c71c58d87a4c3201d1d14a3e7cdcba95041624dbcb84976a38d1c505"`.

###### Derive a per-app secret and sign a webhook body with it:
```yaml
_hmac.sha256:
  key:
    _hmac.sha256:
      key:
        _secret: SUPPORT_ROOT_SECRET
      data:
        _string.concat:
          - 'app:'
          - _payload: app_id
  data:
    _string.concat:
      - _payload: timestamp
      - .
      - _payload: body
```
Returns the hex signature of `<timestamp>.<body>` under the app's derived secret.

## _hmac.sha512

```
({ key: string, data: string }): string
```

The `_hmac.sha512` method computes the HMAC-SHA512 of `data` under `key`. Both are read as UTF-8 strings.

#### Arguments

###### object
  - `key: string`: __Required__ - The secret key.
  - `data: string`: __Required__ - The string to sign.

#### Examples

###### Sign a string:
```yaml
_hmac.sha512:
  key: my-secret
  data: Hello World!
```
Returns: `"498943335e4bb157626950ce4f305568a54816fe13ad5d594902f125cbd9a844f52ba9ad21105f4d8cd78907dbe5315c6be2c439688213054e04e065d3582b51"`.
