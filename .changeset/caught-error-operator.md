---
'@lowdefy/operators-js': minor
'@lowdefy/operators': minor
'@lowdefy/helpers': minor
'@lowdefy/api': minor
'@lowdefy/engine': minor
'@lowdefy/docs': patch
'@lowdefy/docs-content': patch
---

feat: add the `_error` operator, which reads the error being handled.

- **Inside a server `:catch`**, `_error` returns the error that sent the routine there: its `name`, real `message`, `code`, `statusCode` and `cause` chain. Values of the app's secrets in the message are replaced with `[REDACTED]`. It resolves to the innermost `:catch`, a `:finally` reads the error of the `:catch` around its `:try`, and each `:parallel` branch reads its own. A routine can now branch on the failure:

  ```yaml
  - :try:
      - id: get_customer
        type: AxiosHttp
        connectionId: crm
        properties:
          url: /customers
    :catch:
      - :if:
          _eq: [{ _error: statusCode }, 404]
        :then:
          - :reject: Customer not found
      - :throw: Customer lookup failed
  ```

- **Inside a client `catch` action list**, `_error` returns the error that sent the event there. An error from the server keeps its `code` and `statusCode`, so a page can branch on a failed `Request` without an endpoint.
- **Outside a catch**, `_error` returns `null`.
- **`:throw` and `:reject` accept an Error as their message.** `:throw: { _error: true }` rethrows the caught error, keeping its class, `code` and `statusCode`; `:reject: { _error: true }` rejects with its message as the user would see it. Use `{ _error: message }` to send the real message to the user.
- `code` and `statusCode` are read the same way for every connection: `code` is the error's own `code`, and `statusCode` the first number among its `statusCode`, `status` and `response.status`. A request error now carries both from the error its connection threw, and AxiosHttp sets both on a non-2xx response.
