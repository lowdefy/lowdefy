# Request Lifecycle Architecture

How data flows from user action to database and back in Lowdefy.

## Overview

The request lifecycle involves:
1. User action triggers an event
2. Event executes actions (including `request` action)
3. HTTP request sent to API endpoint
4. Server validates, authorizes, and executes connection
5. Response flows back to client state
6. UI re-renders with new data

## Request Flow Diagram

```
USER ACTION (Click/Change)
         ↓
    [Events.triggerEvent]
         ↓
    [Actions.callActions]
         ↓
    [request() action]
         ↓
    [Requests.callRequest]
         ↓
    [HTTP POST: /api/request/{pageId}/{requestId}]
         ↓
    ============ NETWORK BOUNDARY ============
         ↓
    [API: callRequest handler]
         ↓
    [Authorize → Load Config → Evaluate Operators]
         ↓
    [Connection Execution]
         ↓
    [HTTP Response]
         ↓
    ============ NETWORK BOUNDARY ============
         ↓
    [Update context.requests]
         ↓
    [Trigger re-render]
         ↓
    [Display data in UI]
```

## Client-Side Request Flow

### 1. Event Trigger

**File:** `packages/engine/src/Events.js`

```javascript
triggerEvent() {
  eventDescription.loading = true;
  this.block.update = true;
  this.context._internal.update();

  // Execute action chain
  await callActionLoop(actions);

  // Update event history
  eventDescription.loading = false;
  context._internal.update();
}
```

### 2. Action Execution

**File:** `packages/engine/src/Actions.js`

```javascript
callActions() {
  for (action of actions) {
    // Validate action type
    // Parse params with operators
    // Check skip conditions
    // Display loading message

    response = await this.actions[action.type]({
      globals, methods, params
    });

    responses[action.id] = response;
  }
  return { success, responses };
}
```

### 3. Request Action

**File:** `packages/engine/src/actions/createRequest.js`

```javascript
function request(params) {
  // params: string | array | { all: true }
  return context._internal.Requests.callRequests({
    actions, arrayIndices, blockId, event, params
  });
}
```

### 4. Request Manager

**File:** `packages/engine/src/Requests.js`

```javascript
class Requests {
  async callRequest({ requestId, blockId, payload }) {
    const requestConfig = this.requestConfig[requestId];

    // Parse payload with operators
    const { output: payload } = parser.parse({
      input: requestConfig.payload,
      location: requestId
    });

    // Track request state
    const request = {
      blockId, loading: true, payload,
      requestId, response: null
    };

    this.context.requests[requestId].unshift(request);
    return this.fetch(request);
  }

  async fetch(request) {
    const response = await this.context._internal.lowdefy._internal.callRequest({
      blockId, pageId, payload: serialize(request.payload), requestId
    });

    request.response = deserialize(response.response);
    request.loading = false;
    this.context._internal.update();

    return request.response;
  }
}
```

### 5. HTTP Transport

**File:** `packages/client/src/createCallRequest.js`

```javascript
function createCallRequest({ basePath }) {
  return function callRequest({ pageId, payload, requestId }) {
    return request({
      url: `${basePath}/api/request/${pageId}/${requestId}`,
      method: 'POST',
      body: { payload }
    });
  };
}
```

## Server-Side Processing

### 1. Request Handler

**File:** `packages/api/src/routes/request/callRequest.js`

```javascript
async function callRequest(context, { blockId, pageId, payload, requestId }) {
  // Setup context
  context.blockId = blockId;
  context.pageId = pageId;
  context.payload = deserialize(payload);
  context.evaluateOperators = createEvaluateOperators(context);

  // Load configurations
  const requestConfig = await getRequestConfig(context, { pageId, requestId });
  const connectionConfig = await getConnectionConfig(context, { requestConfig });

  // Authorization check
  authorizeRequest(context, { requestConfig });

  // Get connection and resolver
  const connection = getConnection(context, { connectionConfig });
  const requestResolver = getRequestResolver(context, { connection, requestConfig });

  // Evaluate operators in properties
  const { connectionProperties, requestProperties } = evaluateOperators(context, {
    connectionConfig, requestConfig
  });

  // Security checks
  checkConnectionRead(context, { ... });
  checkConnectionWrite(context, { ... });

  // Schema validation
  validateSchemas(context, { ... });

  // Execute request
  const response = await callRequestResolver(context, {
    connectionProperties, requestConfig, requestProperties, requestResolver
  });

  return {
    id: requestConfig.id,
    success: true,
    type: requestConfig.type,
    response: serialize(response)
  };
}
```

### 2. Request Resolver Execution

**File:** `packages/api/src/routes/request/callRequestResolver.js`

```javascript
async function callRequestResolver(context, {
  connectionProperties, requestConfig, requestProperties, requestResolver
}) {
  const response = await requestResolver({
    blockId,
    endpointId,
    connection: connectionProperties,
    connectionId: requestConfig.connectionId,
    pageId,
    payload,
    request: requestProperties,
    requestId: requestConfig.requestId
  });
  return response;
}
```

### 3. Connection Lookup

**File:** `packages/api/src/routes/request/getConnection.js`

```javascript
function getConnection({ connections }, { connectionConfig }) {
  const connection = connections[connectionConfig.type];
  if (!connection) {
    throw new ConfigurationError(
      `Connection type "${connectionConfig.type}" not found.`
    );
  }
  return connection;
}
```

### 4. Request Type Lookup

**File:** `packages/api/src/routes/request/getRequestResolver.js`

```javascript
function getRequestResolver({ }, { connection, requestConfig }) {
  const requestResolver = connection.requests[requestConfig.type];
  if (!requestResolver) {
    throw new ConfigurationError(
      `Request type "${requestConfig.type}" not found.`
    );
  }
  return requestResolver;
}
```

## Connection Architecture

### Connection Structure

**Example:** `packages/plugins/connections/connection-mongodb/src/connections/MongoDBCollection/MongoDBCollection.js`

```javascript
export default {
  schema: { /* JSON Schema */ },
  requests: {
    MongoDBAggregation,
    MongoDBDeleteMany,
    MongoDBDeleteOne,
    MongoDBFind,
    MongoDBFindOne,
    MongoDBInsertMany,
    MongoDBInsertOne,
    MongoDBUpdateMany,
    MongoDBUpdateOne
  }
}
```

### Request Handler Example

**File:** `packages/plugins/connections/connection-mongodb/src/connections/MongoDBCollection/MongoDBFindOne/MongoDBFindOne.js`

```javascript
async function MongodbFindOne({ request, connection }) {
  const { query, options } = deserialize(request);
  const { collection, client } = await getCollection({ connection });

  try {
    const res = await collection.findOne(query, options);
    return serialize(res);
  } finally {
    await client.close();
  }
}

MongodbFindOne.meta = {
  checkRead: true,
  checkWrite: false
};
```

## Security Validation

### Read/Write Checks

**Files:** `packages/api/src/routes/request/checkConnectionRead.js`, `checkConnectionWrite.js`

```javascript
function checkConnectionRead(context, { connectionProperties, requestResolver }) {
  if (requestResolver.meta.checkRead && connectionProperties.read === false) {
    throw new ConfigurationError(
      `Connection does not allow reads.`
    );
  }
}

function checkConnectionWrite(context, { connectionProperties, requestResolver }) {
  if (requestResolver.meta.checkWrite && connectionProperties.write !== true) {
    throw new ConfigurationError(
      `Connection does not allow writes.`
    );
  }
}
```

### Schema Validation

**File:** `packages/api/src/routes/request/validateSchemas.js`

```javascript
function validateSchemas(context, {
  connection, connectionProperties, requestResolver, requestProperties
}) {
  validate({ schema: connection.schema, data: connectionProperties });
  validate({ schema: requestResolver.schema, data: requestProperties });
}
```

## Client Response Handling

### State Manager

**File:** `packages/engine/src/State.js`

```javascript
class State {
  set(field, value) {
    set(this.context.state, field, value);
  }

  resetState() {
    // Restore from frozenState snapshot
    const frozen = deserializeFromString(this.frozenState);
    Object.keys(frozen).forEach(key => this.set(key, frozen[key]));
  }
}
```

### Context Structure

**File:** `packages/engine/src/getContext.js`

```javascript
const ctx = {
  pageId: config.pageId,
  eventLog: [],
  requests: {},      // Indexed by requestId
  state: {},
  _internal: {
    State: new State(ctx),
    Actions: new Actions(ctx),
    Requests: new Requests(ctx),
    update: () => _internal.RootAreas.update()
  }
};

// Access in templates:
// {{ requests.getUserData[0].response.user.name }}
```

## API Endpoints (Routines)

### Endpoint Handler

**File:** `packages/api/src/routes/endpoints/callEndpoint.js`

```javascript
async function callEndpoint(context, { blockId, endpointId, pageId, payload }) {
  context.evaluateOperators = createEvaluateOperators(context);

  const endpointConfig = await getEndpointConfig(context, { endpointId });
  authorizeApiEndpoint(context, { endpointConfig });

  const routineContext = { arrayIndices: [], items: {} };

  const { error, response, status } = await runRoutine(
    context, routineContext, { routine: endpointConfig.routine }
  );

  return { error, response, status, success: !['error', 'reject'].includes(status) };
}
```

### Routine Execution

**File:** `packages/api/src/routes/endpoints/runRoutine.js`

```javascript
async function runRoutine(context, routineContext, { routine }) {
  if (type.isObject(routine)) {
    if (routine.id?.startsWith?.('request:')) {
      return await handleRequest(context, routineContext, { request: routine });
    }
    return await handleControl(context, routineContext, { control: routine });
  }

  if (type.isArray(routine)) {
    for (const item of routine) {
      const res = await runRoutine(context, routineContext, { routine: item });
      if (['return', 'error', 'reject'].includes(res.status)) {
        return res;
      }
    }
    return { status: 'continue' };
  }
}
```

## End-to-End Example

**Scenario:** User searches for data

### Client Side

1. User types "john" in search input
2. Click search button → `onClick` event
3. Event executes: `request('searchUsers')`
4. `Requests.callRequest('searchUsers')`
5. Parse payload: `{{ inputs.searchTerm.value }}` → 'john'
6. HTTP POST `/api/request/dashboard/searchUsers`
7. Set `requests.searchUsers[0].loading = true`
8. UI shows spinner

### Server Side

1. callRequest receives request
2. Load `searchUsers` config
3. Authorize user
4. Get MongoDBCollection connection
5. Get MongoDBFind resolver
6. Evaluate operators
7. Validate schemas
8. Execute: `collection.find({ name: /john/i })`
9. Return serialized response

### Client Response

1. Deserialize response
2. Update: `requests.searchUsers[0].loading = false`
3. Update: `requests.searchUsers[0].response = [...]`
4. Call `context._internal.update()`
5. React re-renders
6. Template evaluates: `{{ requests.searchUsers[0].response }}`

## Key Files

| Component | File |
|-----------|------|
| Event Trigger | `packages/engine/src/Events.js` |
| Action Runner | `packages/engine/src/Actions.js` |
| Request Manager | `packages/engine/src/Requests.js` |
| HTTP Client | `packages/client/src/createCallRequest.js` |
| Server Handler | `packages/api/src/routes/request/callRequest.js` |
| Connection Resolver | `packages/api/src/routes/request/getConnection.js` |
| Request Resolver | `packages/api/src/routes/request/getRequestResolver.js` |
| Operator Evaluator | `packages/api/src/routes/request/evaluateOperators.js` |
| Authorization | `packages/api/src/routes/request/authorizeRequest.js` |
| Validation | `packages/api/src/routes/request/validateSchemas.js` |
| Endpoint Handler | `packages/api/src/routes/endpoints/callEndpoint.js` |
| State Manager | `packages/engine/src/State.js` |

## Architectural Patterns

1. **Configuration-Driven**: All requests defined in YAML/JSON
2. **Plugin Architecture**: Connections provide request handlers
3. **Security Gates**: Authorization, schema validation, read/write checks
4. **Operator System**: Template syntax for dynamic values
5. **Reactive State**: Updates trigger re-renders
6. **Error Handling**: Try/catch with catch actions
7. **Serialization**: Complex objects serialized for transport
