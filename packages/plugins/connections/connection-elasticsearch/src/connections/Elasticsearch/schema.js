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

const nodeUrl = {
  type: 'string',
  format: 'uri',
  pattern: '^(https?)://',
};

const nodeDescription =
  'The Elasticsearch node(s) to connect to. A URL string, an array of URL strings, a node options object, or an array of node options objects.';

const nodeSchema = {
  anyOf: [
    nodeUrl,
    {
      type: 'array',
      items: nodeUrl,
    },
    {
      $ref: '#/definitions/NodeOptions',
    },
    {
      type: 'array',
      items: {
        $ref: '#/definitions/NodeOptions',
      },
    },
  ],
};

export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Connection Schema - Elasticsearch',
  type: 'object',
  properties: {
    node: {
      description: nodeDescription,
      examples: ['http://localhost:9200', 'https://your.node.company.tld:443'],
      ...nodeSchema,
    },
    nodes: {
      description: nodeDescription,
      examples: [['https://node1.company.tld:9200', 'https://node2.company.tld:9200']],
      ...nodeSchema,
    },
    cloud: {
      description:
        'Connect to Elastic Cloud with its Cloud ID instead of "node" or "nodes". Set the credentials with "auth".',
      examples: [
        {
          id: 'name:bG9jYWxob3N0JGFiY2QkZWZnaA==',
        },
      ],
      type: 'object',
      required: ['id'],
      properties: {
        id: {
          type: 'string',
          description: 'The Cloud ID of your Elastic Cloud deployment.',
        },
        username: {
          not: {},
          errorMessage:
            'was removed in Lowdefy 8 (Elasticsearch client 9). Set "auth.username" on the connection instead',
        },
        password: {
          not: {},
          errorMessage:
            'was removed in Lowdefy 8 (Elasticsearch client 9). Set "auth.password" on the connection instead',
        },
      },
    },
    index: {
      description: 'Default index to use for requests.',
      type: 'string',
    },
    auth: {
      description:
        'Your authentication data: basic authentication ("username" and "password"), an API key ("apiKey"), or a bearer token ("bearer").',
      examples: [
        {
          username: 'elastic',
          password: 'changeMe',
        },
        {
          apiKey: 'base64EncodedApiKey',
        },
        {
          bearer: 'token',
        },
      ],
      anyOf: [
        {
          $ref: '#/definitions/ApiKeyAuth',
        },
        {
          $ref: '#/definitions/BasicAuth',
        },
        {
          $ref: '#/definitions/BearerAuth',
        },
      ],
      errorMessage: {
        anyOf:
          'Elasticsearch connection property "auth" should be an object containing credentials',
      },
    },
    maxRetries: {
      description: 'Max number of retries for each request.',
      type: 'number',
      default: 3,
      minimum: 0,
    },
    requestTimeout: {
      description:
        'Max request timeout in milliseconds for each request. By default there is no timeout: the client waits for Elasticsearch to respond.',
      type: 'number',
      exclusiveMinimum: 0,
    },
    pingTimeout: {
      description: 'Max ping request timeout in milliseconds for each request.',
      type: 'number',
      default: 3000,
      exclusiveMinimum: 0,
    },
    sniffInterval: {
      description:
        'Perform a sniff operation every n milliseconds. Sniffing might not be the best solution for you, take a look here to know more: https://www.elastic.co/blog/elasticsearch-sniffing-best-practices-what-when-why-how',
      type: ['number', 'boolean'],
      default: false,
    },
    sniffOnStart: {
      description:
        'Perform a sniff once the client is started. Sniffing might not be the best solution for you, take a look here to know more: https://www.elastic.co/blog/elasticsearch-sniffing-best-practices-what-when-why-how',
      type: 'boolean',
      default: false,
    },
    sniffEndpoint: {
      description: 'Endpoint to ping during a sniff.',
      type: 'string',
      default: '_nodes/_all/http',
    },
    sniffOnConnectionFault: {
      description:
        'Perform a sniff on connection fault. Sniffing might not be the best solution for you, take a look here to know more: https://www.elastic.co/blog/elasticsearch-sniffing-best-practices-what-when-why-how',
      type: 'boolean',
      default: false,
    },
    resurrectStrategy: {
      description: 'Configure the node resurrection strategy.',
      enum: ['none', 'optimistic', 'ping'],
      type: 'string',
      default: 'ping',
    },
    compression: {
      description:
        'Enables gzip request body compression, and asks Elasticsearch for compressed responses. Defaults to true when connecting with "cloud", otherwise false.',
      type: 'boolean',
    },
    tls: {
      $ref: '#/definitions/TlsOptions',
    },
    caFingerprint: {
      description:
        'The SHA256 fingerprint of the CA certificate that signed the certificate of the Elasticsearch server. When set, the client checks that the server certificate was signed by this CA. Only works with https nodes.',
      type: 'string',
    },
    agent: {
      $ref: '#/definitions/AgentOptions',
    },
    name: {
      description: 'The name to identify the client instance in the events.',
      type: 'string',
      default: 'elasticsearch-js',
    },
    opaqueIdPrefix: {
      description:
        'A string that will be use to prefix any X-Opaque-Id header. See https://www.elastic.co/docs/reference/elasticsearch/clients/javascript/observability for more details.',
      type: 'string',
    },
    headers: {
      description: 'A set of custom headers to send in every request.',
      examples: [
        {
          'X-Foo': 'Bar',
        },
      ],
      type: 'object',
    },
    context: {
      description:
        'A custom object that you can use for observability in your events. It will be merged with the API level context option.',
      type: 'object',
    },
    enableMetaHeader: {
      description:
        "If true, adds an header named 'x-elastic-client-meta', containing some minimal telemetry data, such as the client and platform version.",
      type: 'boolean',
      default: true,
    },
    disablePrototypePoisoningProtection: {
      description:
        'Prototype poisoning protection parses responses with secure-json-parse, which rejects "__proto__" and "constructor.prototype" keys. It is off by default (true) because it slows down parsing. Set false to turn on both checks, or "proto" or "constructor" to disable only that check. See https://github.com/fastify/secure-json-parse',
      enum: [true, false, 'proto', 'constructor'],
      default: true,
    },
    maxResponseSize: {
      description:
        'When set, the client aborts a request if the uncompressed response is larger than this number of bytes.',
      type: 'number',
      exclusiveMinimum: 0,
    },
    maxCompressedResponseSize: {
      description:
        'When set, the client aborts a request if the compressed response is larger than this number of bytes.',
      type: 'number',
      exclusiveMinimum: 0,
    },
    serverMode: {
      description:
        'Set to "serverless" when connecting to Elastic Cloud Serverless. This enables compression and turns off features that assume multiple Elasticsearch nodes, like sniffing.',
      enum: ['stack', 'serverless'],
      type: 'string',
      default: 'stack',
    },
    ssl: {
      not: {},
      errorMessage:
        'was renamed to "tls" in Lowdefy 8 (Elasticsearch client 9). Move these options to "tls"',
    },
    suggestCompression: {
      not: {},
      errorMessage:
        'was removed in Lowdefy 8 (Elasticsearch client 9). Set "compression: true" to compress requests and ask for compressed responses',
    },
    proxy: {
      not: {},
      errorMessage:
        'is not supported. The HTTP connection the Elasticsearch client 9 uses (undici) cannot send requests through a proxy',
    },
    read: {
      type: 'boolean',
      default: true,
      description: 'Allow reads from the Elasticsearch index.',
      errorMessage: {
        type: 'Elasticsearch connection property "read" should be a boolean.',
      },
    },
    write: {
      type: 'boolean',
      default: false,
      description: 'Allow writes to the Elasticsearch index.',
      errorMessage: {
        type: 'Elasticsearch connection property "write" should be a boolean.',
      },
    },
  },
  definitions: {
    AgentOptions: {
      description:
        'Options for the HTTP connection pool (undici) the client opens to each node. See https://undici.nodejs.org/#/docs/api/Pool.',
      type: 'object',
      additionalProperties: false,
      properties: {
        keepAliveTimeout: {
          description:
            'Milliseconds an idle socket is kept open when the server does not send a keep-alive hint.',
          type: 'number',
          default: 600000,
        },
        keepAliveMaxTimeout: {
          description:
            'The longest time, in milliseconds, an idle socket is kept open, whatever keep-alive hint the server sends.',
          type: 'number',
          default: 600000,
        },
        keepAliveTimeoutThreshold: {
          description:
            'Milliseconds subtracted from the server keep-alive hint, to avoid using a socket the server is about to close.',
          type: 'number',
          default: 1000,
        },
        pipelining: {
          description: 'The number of requests sent on one socket before waiting for responses.',
          type: 'number',
          default: 1,
        },
        maxHeaderSize: {
          description: 'The maximum size of response headers in bytes.',
          type: 'number',
          default: 16384,
        },
        connections: {
          description: 'The maximum number of sockets to open to each node.',
          type: 'number',
          default: 256,
        },
      },
      errorMessage: {
        type: 'should be an object of undici connection pool options',
        additionalProperties:
          'takes undici connection pool options (keepAliveTimeout, keepAliveMaxTimeout, keepAliveTimeoutThreshold, pipelining, maxHeaderSize, connections). Node.js http.Agent options like keepAlive and maxSockets, and "agent: false", are not supported since Lowdefy 8 (Elasticsearch client 9)',
      },
    },
    ApiKeyAuth: {
      description:
        'The apiKey parameter can be either a base64 encoded string or an object with the values that you can obtain from the create api key endpoint. If you provide both basic authentication credentials and the ApiKey configuration, the ApiKey takes precedence.',
      properties: {
        apiKey: {
          anyOf: [
            {
              properties: {
                api_key: {
                  type: 'string',
                },
                id: {
                  type: 'string',
                },
              },
              required: ['id', 'api_key'],
              type: 'object',
            },
            {
              type: 'string',
            },
          ],
          errorMessage: {
            anyOf:
              'Elasticsearch API key should be specified as a string, or an object containing "id" and "api_key"',
          },
        },
      },
      required: ['apiKey'],
      type: 'object',
    },
    BasicAuth: {
      properties: {
        password: {
          type: 'string',
        },
        username: {
          type: 'string',
        },
      },
      required: ['username'],
      type: 'object',
      errorMessage: {
        required: 'Elasticsearch basic auth credentials must consist of at least a username',
      },
    },
    BearerAuth: {
      description: 'A bearer token, such as a service account token.',
      properties: {
        bearer: {
          type: 'string',
        },
      },
      required: ['bearer'],
      type: 'object',
    },
    TlsOptions: {
      description:
        'TLS options for the connection, passed to Node.js tls.connect, like "ca", "cert", "key" and "rejectUnauthorized". See https://nodejs.org/api/tls.html#tlsconnectoptions-callback',
      examples: [
        {
          ca: 'PEM encoded CA certificate',
          rejectUnauthorized: true,
        },
      ],
      type: 'object',
    },
    NodeOptions: {
      examples: [
        {
          url: 'https://localhost:9200',
          id: 'custom node id',
          tls: {
            rejectUnauthorized: true,
          },
          headers: {
            'X-Foo': 'Bar',
          },
          roles: {
            master: true,
            data: true,
            ingest: true,
            ml: false,
          },
        },
      ],
      type: 'object',
      required: ['url'],
      properties: {
        url: nodeUrl,
        id: {
          type: 'string',
        },
        agent: {
          $ref: '#/definitions/AgentOptions',
        },
        tls: {
          $ref: '#/definitions/TlsOptions',
        },
        caFingerprint: {
          type: 'string',
        },
        headers: {
          type: 'object',
          examples: [
            {
              'X-Foo': 'Bar',
            },
          ],
        },
        roles: {
          properties: {
            data: {
              type: 'boolean',
            },
            ingest: {
              type: 'boolean',
            },
            master: {
              type: 'boolean',
            },
            ml: {
              type: 'boolean',
            },
          },
          type: 'object',
        },
        ssl: {
          not: {},
          errorMessage:
            'was renamed to "tls" in Lowdefy 8 (Elasticsearch client 9). Move these node options to "tls"',
        },
      },
    },
  },
  oneOf: [
    {
      required: ['node'],
    },
    {
      required: ['nodes'],
    },
    {
      required: ['cloud'],
    },
  ],
  errorMessage: {
    type: 'Elasticsearch connection properties should be an object.',
    oneOf:
      'Elasticsearch connection should have exactly one of the properties "node", "nodes" or "cloud".',
    properties: {
      maxRetries: 'Elasticsearch connection "maxRetries" should be 0 or greater',
      requestTimeout: 'Elasticsearch connection "requestTimeout" should be 1 or greater',
      pingTimeout: 'Elasticsearch connection "pingTimeout" should be 1 or greater',
      index: 'Elasticsearch connection property "index" should be a string',
    },
  },
};
