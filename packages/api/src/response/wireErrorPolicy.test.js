/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import { jest } from '@jest/globals';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { RequestError, UserError } from '@lowdefy/errors';

import buildEndpointResult from './buildEndpointResult.js';
import callRequestResolver from '../routes/request/callRequestResolver.js';
import createMcpServer from '../routes/mcp/createMcpServer.js';
import redactErrorResponse from './redactErrorResponse.js';
import redactResponse from './redactResponse.js';
import testContext from '../test/testContext.js';

// Each case builds an error in the shape its library throws - foreign own
// properties, library message text, nesting deeper than the walk's object-depth
// limit - and runs it through the real request, endpoint, websocket and MCP code.
// No live services: the wire policy emits the same fixed fields whatever the input
// shape, so one realistic shape per library is what pins it. Every planted value
// contains PLANTED_, so a single scan of the output finds any that crossed.

const mockPrepareChannel = jest.fn();
jest.unstable_mockModule('../routes/websocket/prepareChannel.js', () => ({
  default: mockPrepareChannel,
}));

let createChannelRegistry;
let createWebSocketConnection;

beforeAll(async () => {
  ({ default: createChannelRegistry } = await import(
    '../routes/websocket/createChannelRegistry.js'
  ));
  ({ default: createWebSocketConnection } = await import(
    '../routes/websocket/createWebSocketConnection.js'
  ));
});

const GENERIC_MESSAGE = 'Something went wrong.';

const WIRE_ERROR_KEYS = new Set([
  'name',
  'message',
  'code',
  'statusCode',
  'configKey',
  'requestId',
  'isLowdefyError',
  'handled',
]);

const silentLogger = { debug: () => {}, error: () => {}, info: () => {}, warn: () => {} };

// The evaluated request properties, which a RequestError carries as `received`.
const requestProperties = {
  url: '/v1/customers',
  headers: { Authorization: 'Bearer PLANTED_KEY_REQUEST_PROPERTIES' },
};

const requestConfig = {
  '~k': 'request_key',
  requestId: 'lookup',
  connectionId: 'upstream',
  type: 'TestRequest',
};

function plantedIn(value) {
  return JSON.stringify(value).match(/PLANTED_\w+/g) ?? [];
}

class AxiosError extends Error {
  constructor(message, { code, config, response }) {
    super(message);
    this.name = 'AxiosError';
    this.isAxiosError = true;
    this.code = code;
    this.config = config;
    this.response = response;
  }
}

class HTTPError extends Error {
  constructor({ request, response, options }) {
    super(
      `Request failed with status code ${response.status} ${response.statusText}: ${request.method} ${request.url}`
    );
    this.name = 'HTTPError';
    this.request = request;
    this.response = response;
    this.options = options;
  }
}

class ResponseError extends Error {
  constructor(meta) {
    super(meta.body.error.type);
    this.name = 'ResponseError';
    this.meta = meta;
  }

  get statusCode() {
    return this.meta.statusCode;
  }
}

function createForeignError({ name, message, props = {}, cause }) {
  const error = cause === undefined ? new Error(message) : new Error(message, { cause });
  error.name = name;
  Object.assign(error, props);
  return error;
}

const axiosHttpResponse = {
  name: 'AxiosHttp 4xx response',
  thrown: () => {
    const config = {
      baseURL: 'https://svc:PLANTED_PASSWORD_AXIOS_BASE_URL@api.example.com',
      url: '/v1/customers',
      method: 'post',
      auth: { username: 'svc', password: 'PLANTED_PASSWORD_AXIOS_AUTH' },
      params: { key: 'PLANTED_KEY_AXIOS_PARAMS' },
      data: '{"note":"PLANTED_ROW_AXIOS_REQUEST_DATA"}',
    };
    const axiosError = new AxiosError('Request failed with status code 404', {
      code: 'ERR_BAD_REQUEST',
      config,
      response: {
        status: 404,
        statusText: 'Not Found',
        headers: {},
        config,
        data: { rows: [{ email: 'PLANTED_ROW_AXIOS_RESPONSE' }] },
      },
    });
    // AxiosHttp wraps a non-2xx response in its own Error.
    const error = new Error('Http response "404: Not Found".', { cause: axiosError });
    error.code = axiosError.code;
    error.statusCode = 404;
    return error;
  },
};

const axiosHttpNetwork = {
  name: 'AxiosHttp network failure',
  thrown: () =>
    new AxiosError('connect ECONNREFUSED 10.0.0.5:443', {
      code: 'ECONNREFUSED',
      config: {
        baseURL: 'https://api.example.com',
        auth: { username: 'svc', password: 'PLANTED_PASSWORD_AXIOS_NETWORK' },
      },
    }),
};

const sendGrid = {
  name: 'SendGrid',
  // axios 0.26 keeps request headers as a plain object rather than an
  // AxiosHeaders instance, so a walk that copies own properties copies the
  // Authorization header with them.
  thrown: () => {
    const config = {
      method: 'post',
      url: 'https://api.sendgrid.com/v3/mail/send',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer SG.PLANTED_KEY_SENDGRID',
      },
      data: '{"personalizations":[{"to":[{"email":"PLANTED_ROW_SENDGRID_RECIPIENT"}]}]}',
    };
    return createForeignError({
      name: 'Error',
      message: 'Request failed with status code 401',
      props: {
        isAxiosError: true,
        config,
        response: {
          status: 401,
          statusText: 'Unauthorized',
          config,
          data: { errors: [{ message: 'The provided authorization grant is invalid.' }] },
        },
      },
    });
  },
};

const googleSheets = {
  name: 'Google Sheets',
  // ky writes the request URL, API key included, into the message.
  thrown: () =>
    new HTTPError({
      request: {
        method: 'GET',
        url: 'https://sheets.googleapis.com/v4/spreadsheets/sheet-1?key=PLANTED_KEY_GOOGLE_SHEETS',
      },
      response: { status: 403, statusText: 'Forbidden' },
      options: { method: 'GET', searchParams: { key: 'PLANTED_KEY_GOOGLE_SHEETS_OPTIONS' } },
    }),
};

const elasticsearch = {
  name: 'Elasticsearch',
  // The authorization header sits past the walk's object-depth limit; the query
  // body sits just inside it.
  thrown: () =>
    new ResponseError({
      body: {
        error: { type: 'security_exception', reason: 'unable to authenticate user [elastic]' },
        status: 401,
      },
      statusCode: 401,
      headers: {},
      meta: {
        context: null,
        request: {
          params: {
            method: 'POST',
            path: '/customers/_search',
            body: '{"query":{"match":{"email":"PLANTED_ROW_ELASTICSEARCH"}}}',
            querystring: '',
            headers: { authorization: 'Basic PLANTED_PASSWORD_ELASTICSEARCH' },
          },
          options: {},
          id: 1,
        },
        name: 'elasticsearch-js',
        attempts: 0,
        aborted: false,
      },
    }),
};

const redis = {
  name: 'Redis',
  thrown: () => {
    const error = new TypeError('Invalid URL');
    error.code = 'ERR_INVALID_URL';
    error.input = 'redis://:PLANTED_PASSWORD_REDIS@cache.internal:6379:0';
    return error;
  },
};

const knexSqlite = {
  name: 'Knex sqlite',
  // knex prefixes the driver message with the SQL, bindings interpolated.
  thrown: () =>
    createForeignError({
      name: 'SqliteError',
      message:
        "insert into `users` (`email`) values ('PLANTED_ROW_SQLITE') - SQLITE_CONSTRAINT_UNIQUE: UNIQUE constraint failed: users.email",
      props: { code: 'SQLITE_CONSTRAINT_UNIQUE', errno: 19 },
    }),
};

const knexMysql = {
  name: 'Knex mysql2',
  thrown: () => {
    const driverError = createForeignError({
      name: 'Error',
      message: "Duplicate entry 'PLANTED_ROW_MYSQL_ENTRY' for key 'users.email'",
      props: {
        code: 'ER_DUP_ENTRY',
        errno: 1062,
        sqlState: '23000',
        sqlMessage: "Duplicate entry 'PLANTED_ROW_MYSQL_ENTRY' for key 'users.email'",
        sql: "insert into `users` (`email`) values ('PLANTED_ROW_MYSQL_SQL')",
      },
    });
    return createForeignError({
      name: 'Error',
      message: `insert into \`users\` (\`email\`) values ('PLANTED_ROW_MYSQL_SQL') - ${driverError.message}`,
      props: { code: 'ER_DUP_ENTRY', errno: 1062 },
      cause: driverError,
    });
  },
};

const knexPg = {
  name: 'Knex pg',
  thrown: () =>
    createForeignError({
      name: 'error',
      message:
        'insert into "users" ("email") values ($1) - duplicate key value violates unique constraint "users_email_key"',
      props: {
        length: 213,
        severity: 'ERROR',
        code: '23505',
        detail: 'Key (email)=(PLANTED_ROW_PG) already exists.',
        schema: 'public',
        table: 'users',
        constraint: 'users_email_key',
        file: 'nbtinsert.c',
        line: '666',
        routine: '_bt_check_unique',
      },
    }),
};

const knexMssql = {
  name: 'Knex mssql',
  // tedious names its class RequestError too, so the name alone passes the wire.
  thrown: () =>
    createForeignError({
      name: 'RequestError',
      message:
        "insert into [users] ([email]) values (N'PLANTED_ROW_MSSQL_SQL') - Violation of UNIQUE KEY constraint 'UQ_users_email'. Cannot insert duplicate key in object 'dbo.users'. The duplicate key value is (PLANTED_ROW_MSSQL_KEY).",
      props: { code: 'EREQUEST', number: 2627, state: 1, class: 14 },
    }),
};

function createApiCallError() {
  return createForeignError({
    name: 'AI_APICallError',
    message: 'Rate limit reached for gpt-4o in organization org-PLANTED_KEY_AI_ORG.',
    props: {
      url: 'https://api.openai.com/v1/chat/completions',
      requestBodyValues: {
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: 'PLANTED_ROW_AI_SYSTEM_PROMPT' },
          { role: 'user', content: 'Summarise my account.' },
        ],
        // Past the walk's object-depth limit.
        providerOptions: { gateway: { byok: { openai: [{ apiKey: 'PLANTED_KEY_AI_BYOK' }] } } },
      },
      statusCode: 429,
      responseHeaders: { 'x-request-id': 'req_1' },
      responseBody:
        '{"error":{"message":"Rate limit reached for gpt-4o in organization org-PLANTED_KEY_AI_ORG."}}',
      isRetryable: true,
    },
  });
}

const aiProvider = {
  name: 'AI provider',
  thrown: () => {
    const errors = [createApiCallError(), createApiCallError(), createApiCallError()];
    const lastError = errors[errors.length - 1];
    return createForeignError({
      name: 'AI_RetryError',
      message: `Failed after 3 attempts. Last error: ${lastError.message}`,
      props: { reason: 'maxRetriesExceeded', errors, lastError },
    });
  },
};

const mongoBulkWrite = {
  name: 'MongoDB bulk write',
  thrown: () => {
    const errmsg =
      'E11000 duplicate key error collection: app.users index: email_1 dup key: { email: "PLANTED_ROW_MONGO_DUP" }';
    return createForeignError({
      name: 'MongoBulkWriteError',
      message: errmsg,
      props: {
        code: 11000,
        writeErrors: [
          {
            index: 0,
            code: 11000,
            errmsg,
            op: { email: 'PLANTED_ROW_MONGO_DUP', passwordHash: 'PLANTED_PASSWORD_MONGO_OP' },
          },
        ],
        result: { insertedCount: 0, matchedCount: 0 },
      },
    });
  },
};

const mongoNetwork = {
  name: 'MongoDB network failure',
  // A message mentioning "network" makes the request layer wrap it in a
  // ServiceError, whose own message copies this one.
  thrown: () =>
    createForeignError({
      name: 'MongoNetworkError',
      message:
        'network error while connecting to mongodb+srv://app:PLANTED_PASSWORD_MONGO_NETWORK@cluster0.example.net',
    }),
};

const s3 = {
  name: 'S3',
  thrown: () =>
    createForeignError({
      name: 'SignatureDoesNotMatch',
      message:
        'The request signature we calculated does not match the signature you provided. Check your key and signing method.',
      props: {
        $fault: 'client',
        $metadata: { httpStatusCode: 403, requestId: 'R1', attempts: 1 },
        Code: 'SignatureDoesNotMatch',
        AWSAccessKeyId: 'AKIA_PLANTED_KEY_S3_ACCESS',
        StringToSign:
          'AWS4-HMAC-SHA256\n20260923T000000Z\n20260923/eu-west-1/s3/aws4_request\nPLANTED_KEY_S3_STRING_TO_SIGN',
        CanonicalRequest:
          'PUT\n/uploads/PLANTED_ROW_S3_OBJECT_KEY.pdf\nX-Amz-Credential=AKIA_PLANTED_KEY_S3_ACCESS',
        SignatureProvided: 'PLANTED_KEY_S3_SIGNATURE',
      },
    }),
};

const cases = [
  axiosHttpResponse,
  axiosHttpNetwork,
  sendGrid,
  googleSheets,
  elasticsearch,
  redis,
  knexSqlite,
  knexMysql,
  knexPg,
  knexMssql,
  aiProvider,
  mongoBulkWrite,
  mongoNetwork,
  s3,
];

// Wraps the error exactly as a failing request step does: ServiceError for a
// network, timeout or 5xx failure, RequestError carrying the evaluated request
// properties otherwise.
async function throwFromRequest(thrown) {
  const context = testContext({ logger: silentLogger });
  return callRequestResolver(context, {
    connectionProperties: {},
    requestConfig,
    requestProperties,
    requestResolver: async () => {
      throw thrown;
    },
  }).catch((error) => error);
}

const prodContext = { mode: 'prod', rid: 'rid-1' };
const devContext = { mode: 'dev', rid: 'rid-1' };

describe.each(cases)('$name error', ({ thrown }) => {
  test('the prod wire error carries only the fixed fields and the generic message', async () => {
    const error = await throwFromRequest(thrown());
    expect(error).toBeInstanceOf(Error);

    const payload = redactErrorResponse(prodContext, error);

    expect(plantedIn(payload)).toEqual([]);
    expect(Object.keys(payload)).toEqual(['~e']);
    expect(Object.keys(payload['~e']).filter((key) => !WIRE_ERROR_KEYS.has(key))).toEqual([]);
    expect(payload['~e'].message).toBe(GENERIC_MESSAGE);

    const result = buildEndpointResult(prodContext, { error, response: null, status: 'error' });
    expect(plantedIn(result)).toEqual([]);
  });

  test('foreign detail stays off the wire when the error is the cause of a UserError', async () => {
    const cause = await throwFromRequest(thrown());
    const error = new UserError('Could not save the customer.', {
      cause,
      metaData: { failure: await throwFromRequest(thrown()) },
    });

    const payload = redactErrorResponse(prodContext, error);

    expect(plantedIn(payload)).toEqual([]);
    expect(payload['~e'].message).toBe('Could not save the customer.');
    expect(payload['~e'].cause.message).toBe(GENERIC_MESSAGE);
    expect(payload['~e'].metaData.failure.message).toBe(GENERIC_MESSAGE);
  });

  test('foreign detail stays off the wire when the error is an own property of another error', async () => {
    const error = new RequestError('Batch failed.', { configKey: 'batch_key' });
    error.firstFailure = await throwFromRequest(thrown());

    expect(plantedIn(redactErrorResponse(prodContext, error))).toEqual([]);
  });

  test('foreign detail stays off the wire when the error is returned inside a response value', async () => {
    const response = {
      saved: false,
      failures: [{ row: 1, error: await throwFromRequest(thrown()) }],
    };

    const serialized = redactResponse(prodContext, response);

    expect(plantedIn(serialized)).toEqual([]);
    expect(serialized.failures[0].error['~e'].message).toBe(GENERIC_MESSAGE);
  });

  test('in dev foreign detail reaches only devError, never the wire error', async () => {
    const prod = redactErrorResponse(prodContext, await throwFromRequest(thrown()));
    const payload = redactErrorResponse(devContext, await throwFromRequest(thrown()));
    const { devError, ...wire } = payload;

    expect(plantedIn(wire)).toEqual([]);
    expect(wire).toEqual(prod);
    // The dev tools still get the detail, so the case really planted something.
    expect(plantedIn(devError).length).toBeGreaterThan(0);
  });
});

// Transport rows run the error each plugin throws, before any request-layer
// wrapping - each transport wraps or projects it itself.
const transportCases = [googleSheets, axiosHttpResponse];

function mockChannel({ resolver }) {
  mockPrepareChannel.mockImplementation(async (context, { websocketId }) => ({
    connectionProperties: null,
    properties: { publish: true },
    websocketConfig: { websocketId, type: 'TestSource', '~k': 'websockets.0' },
    websocketResolver: resolver,
  }));
}

function createWebsocketContext() {
  return {
    rid: 'r',
    mode: 'prod',
    logger: { debug: jest.fn(), error: jest.fn(), info: jest.fn() },
    handleError: jest.fn(),
  };
}

function sentFrames(send) {
  return send.mock.calls.map(([message]) => JSON.parse(message));
}

async function flushMicrotasks() {
  // Resolver start and failure handling run in promise microtasks.
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve();
  }
}

const mcpJson = {
  name: 'test-tools',
  version: '1.0.0',
  endpoints: ['get-customer'],
  configured: true,
};

function createMcpContext({ thrown }) {
  const failingRequest = jest.fn(async () => {
    throw thrown();
  });
  failingRequest.schema = {};
  failingRequest.meta = { checkRead: false, checkWrite: false };
  const files = {
    'mcp.json': mcpJson,
    'api/get-customer.json': {
      endpointId: 'get-customer',
      id: 'endpoint:get-customer',
      type: 'Api',
      auth: { public: true },
      payloadSchema: { type: 'object' },
      routine: {
        id: 'request:get-customer:lookup',
        type: 'FailingRequest',
        stepId: 'lookup',
        connectionId: 'upstream',
        properties: {},
      },
    },
    'connections/upstream.json': {
      id: 'connection:upstream',
      type: 'TestConnection',
      connectionId: 'upstream',
    },
  };
  const context = testContext({
    connections: {
      TestConnection: { schema: {}, requests: { FailingRequest: failingRequest } },
    },
    logger: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() },
    mode: 'prod',
    readConfigFile: jest.fn((path) => files[path] ?? null),
    session: { user: { id: 'user_1' } },
  });
  return { context, failingRequest };
}

async function callMcpTool(context) {
  const server = await createMcpServer({ context });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  await Promise.all([client.connect(clientTransport), server.connect(serverTransport)]);
  return client.callTool({ name: 'get-customer', arguments: {} });
}

describe.each(transportCases)('$name error over a transport', ({ thrown }) => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('a websocket publish reply carries only the generic wire error', async () => {
    const resolver = jest.fn(() => new Promise(() => {}));
    resolver.meta = { publish: true };
    resolver.onPublish = jest.fn(async () => {
      throw thrown();
    });
    mockChannel({ resolver });
    const send = jest.fn();
    const connection = createWebSocketConnection(createWebsocketContext(), {
      registry: createChannelRegistry(),
      send,
    });

    await connection.handleMessage(JSON.stringify({ type: 'subscribe', websocketId: 'chat' }));
    await connection.handleMessage(
      JSON.stringify({ type: 'publish', websocketId: 'chat', payload: {}, requestId: 'req-1' })
    );
    connection.close();

    expect(resolver.onPublish).toHaveBeenCalledTimes(1);
    const frames = sentFrames(send);
    const errorFrame = frames.find((frame) => frame.type === 'error');
    expect(plantedIn(frames)).toEqual([]);
    expect(errorFrame.error['~e'].message).toBe(GENERIC_MESSAGE);
  });

  test('a websocket broadcast carries only the generic message', async () => {
    jest.useFakeTimers({ doNotFake: ['performance'] });
    const resolver = jest.fn().mockRejectedValueOnce(thrown());
    mockChannel({ resolver });
    const registry = createChannelRegistry();
    const subscriber = { id: 'a', subscriptions: new Map(), send: jest.fn() };

    await registry.subscribe(createWebsocketContext(), {
      websocketId: 'ticker',
      payload: {},
      subscriber,
    });
    await flushMicrotasks();
    // Clears the pending restart timer along with the channel.
    registry.unsubscribeAll({ subscriber });

    const frames = sentFrames(subscriber.send);
    expect(plantedIn(frames)).toEqual([]);
    expect(frames).toEqual([{ type: 'error', websocketId: 'ticker', message: GENERIC_MESSAGE }]);
  });

  test('a prod MCP tool result for a failed endpoint carries only the generic message', async () => {
    const { context, failingRequest } = createMcpContext({ thrown });

    const result = await callMcpTool(context);

    expect(failingRequest).toHaveBeenCalledTimes(1);
    expect(plantedIn(result)).toEqual([]);
    expect(result.isError).toBe(true);
    expect(result.content).toEqual([{ type: 'text', text: GENERIC_MESSAGE }]);
  });

  test('a prod MCP tool result for an error thrown outside the endpoint carries only the generic message', async () => {
    const { context } = createMcpContext({ thrown });
    context.readConfigFile.mockImplementation((path) => {
      if (path === 'mcp.json') return mcpJson;
      throw thrown();
    });

    const result = await callMcpTool(context);

    expect(plantedIn(result)).toEqual([]);
    expect(result.isError).toBe(true);
    expect(result.content).toEqual([{ type: 'text', text: GENERIC_MESSAGE }]);
  });
});
