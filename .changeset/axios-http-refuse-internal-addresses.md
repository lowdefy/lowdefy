---
'@lowdefy/connection-axios-http': minor
'@lowdefy/docs': minor
---

feat(connection-axios-http): AxiosHttp refuses internal addresses by default

**Breaking:** an `AxiosHttp` request to an address that is not public now fails: localhost, private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local addresses such as the cloud metadata endpoint `169.254.169.254`, and the like. A hostname is checked by the address it resolves to, and every redirect is checked too. An app that calls a service on the same machine or network, such as a localhost API, a Docker service name or a private network API, sets `allowInternalAddresses: true` on the connection:

```yaml
connections:
  - id: internal_api
    type: AxiosHttp
    properties:
      baseURL: http://orders-service:8080
      allowInternalAddresses: true
```

Request properties can be filled from the client payload, so a request with `url: { _payload: url }` could make the server call any address it can reach. The check stops that reaching internal services.

Also:

- `allowedHosts` on the connection lists the hostnames requests may connect to. A request to any other host, or a redirect to one, is refused. It applies alongside the address check.
- `allowInternalAddresses`, `allowedHosts`, `allowAbsoluteUrls`, `proxy`, `socketPath`, `httpVersion`, `httpAgentOptions` and `httpsAgentOptions` can only be set on the connection. A request that sets one fails schema validation.
- Without `allowInternalAddresses`, the server connects directly: `HTTP_PROXY` and `HTTPS_PROXY` are ignored, and `proxy`, `socketPath` and `httpVersion: 2` fail, since the address check cannot see where they connect.
- `adapter`, `transport`, `lookup`, `beforeRedirect`, `httpAgent` and `httpsAgent` are not supported on a connection or request.
