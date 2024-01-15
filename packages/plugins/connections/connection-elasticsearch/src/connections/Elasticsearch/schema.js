/*
  Copyright 2020-2024 Lowdefy, Inc

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

export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Connection Schema - Elasticsearch',
  type: 'object',
  properties: {
    node: {
      description:
        'The Elasticsearch endpoint to use. It can be a single string, an array of strings, or an object (or an array of objects) that represents the node',
      examples: ['http://localhost:9200', 'https://your.node.company.tld:443'],
      anyOf: [
        {
          items: {
            type: 'string',
            format: 'uri',
            pattern: '^(https?)://',
          },
          type: 'array',
        },
        {
          $ref: '#/definitions/NodeOptions',
        },
        {
          items: {
            $ref: '#/definitions/NodeOptions',
          },
          type: 'array',
        },
        {
          type: 'string',
          format: 'uri',
          pattern: '^(https?)://',
        },
      ],
    },
    nodes: {
      description:
        'The Elasticsearch endpoint to use. It can be a single string, an array of strings, or an object (or an array of objects) that represents the node',
      examples: [
        {
          url: 'http://localhost:9200',
          ssl: 'ssl options',
          agent: 'http agent options',
          id: 'custom node id',
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
        'http://localhost:9200',
        'https://your.node.company.tld:443',
      ],
      anyOf: [
        {
          items: {
            type: 'string',
            format: 'uri',
            pattern: '^(https?)://',
          },
          type: 'array',
        },
        {
          $ref: '#/definitions/NodeOptions',
        },
        {
          items: {
            $ref: '#/definitions/NodeOptions',
          },
          type: 'array',
        },
        {
          type: 'string',
          format: 'uri',
          pattern: '^(https?)://',
        },
      ],
    },
    index: {
      description: 'Default index to use for requests.',
      type: 'string',
    },
    auth: {
      description: 'Your authentication data. You can use both basic authentication and ApiKey.',
      examples: [
        {
          username: 'elastic',
          password: 'changeMe',
        },
        {
          apiKey: 'base64EncodedApiKey',
        },
      ],
      anyOf: [
        {
          $ref: '#/definitions/ApiKeyAuth',
        },
        {
          $ref: '#/definitions/BasicAuth',
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
      description: 'Max request timeout in milliseconds for each request.',
      type: 'number',
      default: 30000,
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
    suggestCompression: {
      description: 'Adds accept-encoding header to every request.',
      type: 'boolean',
      default: false,
    },
    compression: {
      description: 'Enables gzip request body compression.',
      enum: ['gzip'],
      type: ['string', 'boolean'],
      default: false,
    },
    ssl: {
      $ref: '#/definitions/ConnectionOptions',
    },
    proxy: {
      description:
        'If you are using an http(s) proxy, you can put its url here. The client will automatically handle the connection to it.',
      type: 'string',
      format: 'uri',
      pattern: '^(https?)://',
      examples: ['http://localhost:8080', 'http://user:pwd@localhost:8080'],
      default: null,
    },
    agent: {
      description:
        'HTTP agent options. If you want to disable the HTTP agent use entirely (and disable the `keep-alive` feature), set the agent to `false`. See https://nodejs.org/api/http.html#http_new_agent_options.',
      default: null,
      examples: [
        {
          agent: 'options',
        },
        {
          agent: false,
        },
      ],
      anyOf: [
        {
          $ref: '#/definitions/AgentOptions',
        },
        {
          enum: [false],
          type: 'boolean',
        },
        {
          type: 'object',
        },
      ],
    },
    name: {
      description: 'The name to identify the client instance in the events.',
      type: 'string',
      default: 'elasticsearch-js',
    },
    opaqueIdPrefix: {
      description:
        'A string that will be use to prefix any X-Opaque-Id header. See https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/observability.html#x-opaque-id_support[X-Opaque-Id support] for more details.',
      default: null,
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
      default: {},
    },
    context: {
      description:
        'A custom object that you can use for observability in your events. It will be merged with the API level context option.',
      type: 'object',
      default: null,
    },
    enableMetaHeader: {
      description:
        "If true, adds an header named 'x-elastic-client-meta', containing some minimal telemetry data, such as the client and platform version.",
      type: 'boolean',
      default: true,
    },
    cloud: {
      description:
        'Custom configuration for connecting to Elastic Cloud. See Authentication for more details: https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/auth-reference.html',
      examples: [
        {
          id: 'name:bG9jYWxob3N0JGFiY2QkZWZnaA==',
        },
      ],
      properties: {
        id: {
          type: 'string',
        },
        password: {
          type: 'string',
        },
        username: {
          type: 'string',
        },
      },
      type: 'object',
      default: null,
    },
    disablePrototypePoisoningProtection: {
      description:
        'By the default the client will protect you against prototype poisoning attacks. If needed you can disable prototype poisoning protection entirely or one of the two checks. Read the `secure-json-parse` documentation to learn more: https://github.com/fastify/secure-json-parse',
      enum: ['constructor', false, 'proto', true],
      default: false,
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
      description: 'Set of configurable options to set on the agent.',
      properties: {
        keepAlive: {
          description:
            'Keep sockets around even when there are no outstanding requests, so they can be used for future requests without having to reestablish a TCP connection. Not to be confused with the `keep-alive` value of the `Connection` header. The `Connection: keep-alive` header is always sent when using an agent except when the `Connection` header is explicitly specified or when the `keepAlive` and `maxSockets` options are respectively set to `false` and `Infinity`, in which case `Connection: close` will be used.',
          default: false,
          type: 'boolean',
        },
        keepAliveMsecs: {
          description:
            'When using the `keepAlive` option, specifies the initial delay for TCP Keep-Alive packets. Ignored when the `keepAlive` option is `false` or `undefined`',
          type: 'number',
          default: 1000,
        },
        maxFreeSockets: {
          description:
            'Maximum number of sockets to leave open in a free state. Only relevant if `keepAlive` is set to `true`',
          type: 'number',
          default: 256,
        },
        maxSockets: {
          description:
            'Maximum number of sockets to allow per host. If the same host opens multiple concurrent connections, each request will use new socket until the `maxSockets` value is reached. If the host attempts to open more connections than `maxSockets`, the additional requests will enter into a pending request queue, and will enter active connection state when an existing connection terminates. This makes sure there are at most maxSockets active connections at any point in time, from a given host.',
          type: 'number',
          default: 'Infinity',
        },
      },
      type: 'object',
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
              type: 'object',
            },
            {
              type: 'string',
            },
          ],
          errorMessage: {
            anyOf:
              'Elasticsearch API key should be specified as a string, or an object containing Elasticsearch cloud credentials',
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
    ConnectionOptions: {
      description:
        'http.SecureContextOptions - See node.js SSL configuration: https://nodejs.org/api/tls.html',
      type: 'object',
      default: null,
    },
    NodeOptions: {
      examples: [
        {
          url: 'http://localhost:9200',
          ssl: 'ssl options',
          agent: 'http agent options',
          id: 'custom node id',
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
      properties: {
        agent: {
          $ref: '#/definitions/AgentOptions',
        },
        headers: {
          type: 'object',
          examples: [
            {
              'X-Foo': 'Bar',
            },
          ],
        },
        id: {
          type: 'string',
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
          $ref: '#/definitions/ConnectionOptions',
        },
        url: {
          type: 'string',
          format: 'uri',
          pattern: '^(https?)://',
        },
      },
      type: 'object',
    },
  },
  oneOf: [
    {
      required: ['node'],
    },
    {
      required: ['nodes'],
    },
  ],
  errorMessage: {
    type: 'Elasticsearch connection properties should be an object.',
    oneOf: 'Elasticsearch connection should have required property "node" or "nodes".',
    properties: {
      maxRetries: 'Elasticsearch connection "maxRetries" should be 0 or greater',
      requestTimeout: 'Elasticsearch connection "requestTimeout" should be 1 or greater',
      pingTimeout: 'Elasticsearch connection "pingTimeout" should be 1 or greater',
      index: 'Elasticsearch connection property "index" should be a string',
    },
  },
};
