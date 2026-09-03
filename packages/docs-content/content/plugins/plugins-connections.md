# Connection and Request Plugins

Connections and requests are used to integrate with other services like API's or databases.

Connections configure the settings to the external service, and often contain parameters like connection strings, urls and secrets like passwords or API keys. Lowdefy does not execute any code for the connection, it is merely a convenient object to hold configuration that is shared by multiple requests.

Each connection type can include a number of request types. Requests are the functions that the Lowdefy server executes. The response returned by the request function will be serialised into JSON (with additional support for dates and Javascript errors) and used as the response value for the request by the client. If a promise is returned it wil be awaited.

Request parameters:
- `callApi: function`: Invoke another Lowdefy API endpoint in-process. See [Calling another endpoint](#calling-another-endpoint) below.
- `connection: object`: The connection `properties` defined by the user in the Lowdefy configuration. Operators are evaluated before the properties are passed to the request.
- `connectionId: string`: The connectionId used by the request and as set on the request.
- `pageId: string`: The pageId from which the request was called.
- `payload: object`: The payload data object passed to the request. Operators are evaluated on the client before the payload is passed to the server request function.
- `request: object`: The request `properties` defined by the user in the Lowdefy configuration. Operators are evaluated before the properties are passed to the request.
- `requestId: object`: The requestId of the request.
- `tenant: object | null`: The [tenant wall](/organizations#the-tenant-wall) verdict for this request — `{ field, value }` (plus `authored: true` for a `tenant: authored` request) when the connection is scoped, `null` otherwise. A connection type that declares tenant support in its `types.js` meta must enforce it: stamp writes, merge filters, inject pipeline matches.
- `trace: object | undefined`: An optional dev-only collector, present only when the request was run through the dev tools with `explain: true` (see [AI agent docs](/ai-agent-docs#explaining-a-request-explain-true)). A resolver that supports it sets `trace.effective` to the value it is about to send to its driver, immediately before the call, and pushes one `{ at, injected }` entry onto `trace.rewritten` for every clause it injects (`at` is a path into the authored `request` properties). A resolver that ignores `trace` behaves exactly as before — it must never change behaviour based on its presence.

#### Calling another endpoint

Request resolvers can invoke a Lowdefy API endpoint from inside the resolver using the `callApi` function from the argument bag:

```js
const response = await callApi({ endpointId, payload });
```

- `endpointId: string`: __Required__ - The id of the target endpoint. Module endpoints use a `<module>/<endpoint>` id — `callApi` treats this as an opaque string and does not parse it.
- `payload: object`: Optional payload passed to the target endpoint's routine as `_payload`. Already-evaluated by the caller.

`callApi` returns the value returned by the target's `:return` step, or `null` if the target routine terminates without an explicit `:return`. The semantics match the routine [`CallApi`](/lowdefy-api#calling-other-endpoints) step:

- The caller's user identity is used to authorize the target endpoint — no auth bypass.
- The target runs in an isolated routine context: fresh `_payload`, fresh `_state`, fresh `_step` namespace.
- The target inherits the caller's parser closure — `_user`, `_secret`, `_env` resolve to the same values as the caller.
- [Internal API endpoints](/lowdefy-api#internal-api-endpoints) are reachable.
- Endpoint calls share a per-chain depth cap of 10 with routine `:call_api` steps. Exceeding the cap throws an error.

###### Errors

`callApi` throws on failure. The thrown error preserves its underlying class so resolvers can branch on it:

- `ConfigError` — unknown endpoint id, unauthorized against the target, or depth cap exceeded. Unauthorized collapses to the same "does not exist" message as a missing endpoint to avoid leaking endpoint existence.
- `UserError` — the target routine terminated with [`:throw`](/:throw) or [`:reject`](/:reject). Catch this class to distinguish a deliberately-failed routine from a system fault.
- Other Lowdefy error classes (`RequestError`, `ServiceError`) propagate unchanged from the target's failure site.

###### Example

A simplified resolver that looks up a user via another endpoint before running its own request:

```js
async function FetchOrderWithUser({ callApi, request, connection }) {
  const user = await callApi({
    endpointId: 'get_user',
    payload: { id: request.userId },
  });
  const orders = await connection.db
    .collection('orders')
    .find({ user_id: user.id })
    .toArray();
  return { user, orders };
}

FetchOrderWithUser.meta = {
  checkRead: true,
  checkWrite: false,
};

export default FetchOrderWithUser;
```

#### Schema Validation

A [JSON Schema](https://json-schema.org/) schema can be used to validate the connection and request properties before they are passed to the request function. The [ajv-errors](https://ajv.js.org/packages/ajv-errors.html) package is used to provide useful error messages if the schema validation fails. Attached the json-schema to the request function with property `schema`, to validate request input before the request function is called.

#### Examples

###### A simplified version of the AxiosHttp request:

```js
import axios from 'axios';
import { mergeObjects } from '@lowdefy/helpers';

import schema from '../schema.js';

async function AxiosHttp({ request, connection }) {
  const config = mergeObjects([connection, request]);
  const res = await axios(config);
  const { status, statusText, headers, method, path, data } = res;
  return { status, statusText, headers, method, path, data };
}

AxiosHttp.schema = schema; // Attached json-schema used to validate request input before the request function is called.
AxiosHttp.meta = {
  checkRead: false,
  checkWrite: false,
};

export default AxiosHttp;
```
