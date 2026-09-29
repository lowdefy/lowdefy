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

import createMetaSchema from '../createMetaSchema.js';
import endpointIdPattern from '../endpointIdPattern.js';

const queryValue = {
  type: ['string', 'number', 'boolean', 'null'],
};

export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - TregCall',
  type: 'object',
  properties: {
    endpoint: {
      type: 'string',
      pattern: endpointIdPattern,
      maxLength: 200,
      description:
        'The catalog or routed endpoint id to call, such as "treg.people.email.find". Find ids with TregCatalogSearch. Upstream URLs are not accepted.',
      errorMessage: {
        type: 'TregCall request property "endpoint" should be a string.',
        pattern:
          'TregCall request property "endpoint" should be a treg endpoint id of lowercase letters, digits, ".", "_" and "-", such as "treg.people.email.find". Upstream URLs are not accepted.',
        maxLength: 'TregCall request property "endpoint" should be at most 200 characters.',
      },
    },
    tool: {
      type: 'string',
      pattern: '^[A-Za-z0-9][A-Za-z0-9._-]*$',
      maxLength: 200,
      description:
        "The name of one of the team's own registered tools. Needs allowCustomTools on the connection, and a path.",
      errorMessage: {
        type: 'TregCall request property "tool" should be a string.',
        pattern:
          'TregCall request property "tool" should be a tool name of letters, digits, ".", "_" and "-".',
        maxLength: 'TregCall request property "tool" should be at most 200 characters.',
      },
    },
    path: {
      type: 'string',
      maxLength: 2000,
      description:
        'The path on the tool\'s API, such as "/v1/charges". A path only: no scheme, host, query or "..".',
      errorMessage: {
        type: 'TregCall request property "path" should be a string.',
        maxLength: 'TregCall request property "path" should be at most 2000 characters.',
      },
    },
    method: {
      type: 'string',
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      description: 'The HTTP method. Defaults to POST when a body is given, otherwise GET.',
      errorMessage: {
        type: 'TregCall request property "method" should be a string.',
        enum: 'TregCall request property "method" should be one of GET, POST, PUT, PATCH or DELETE.',
      },
    },
    query: {
      type: 'object',
      description: 'Query parameters. An array value sends the parameter once per item.',
      additionalProperties: {
        anyOf: [queryValue, { type: 'array', items: queryValue }],
        errorMessage:
          'TregCall request property "query" values should be strings, numbers, booleans or arrays of them.',
      },
      errorMessage: {
        type: 'TregCall request property "query" should be an object.',
      },
    },
    body: {
      description: 'The JSON request body. A routed endpoint takes its inputs here.',
    },
    idempotencyKey: {
      type: 'string',
      minLength: 1,
      maxLength: 255,
      description:
        'Sent as Idempotency-Key. A retry with the same key gets the stored answer and is not charged again. Use a new key for new work; reusing one for a different request is refused.',
      errorMessage: {
        type: 'TregCall request property "idempotencyKey" should be a string.',
        minLength: 'TregCall request property "idempotencyKey" should not be empty.',
        maxLength: 'TregCall request property "idempotencyKey" should be at most 255 characters.',
      },
    },
    maxCost: {
      type: 'number',
      minimum: 0,
      description:
        "The spend ceiling for this call in USD (X-Treg-Route-Max-Cost), overriding the connection's maxCost. On a routed endpoint it bounds the whole waterfall.",
      errorMessage: {
        type: 'TregCall request property "maxCost" should be a number.',
        minimum: 'TregCall request property "maxCost" should be at least 0.',
      },
    },
    maxAge: {
      type: 'integer',
      minimum: 0,
      description: 'Only accept a cached answer younger than this many seconds (X-Treg-Max-Age).',
      errorMessage: {
        type: 'TregCall request property "maxAge" should be an integer.',
        minimum: 'TregCall request property "maxAge" should be at least 0.',
      },
    },
    noCache: {
      type: 'boolean',
      description: 'Force a live call instead of a cached answer (Cache-Control: no-cache).',
      errorMessage: {
        type: 'TregCall request property "noCache" should be a boolean.',
      },
    },
    waterfall: {
      type: 'boolean',
      description:
        'Routed endpoints: false stops at the first provider that misses (X-Treg-Route-Waterfall: 0). treg falls through to the next provider by default.',
      errorMessage: {
        type: 'TregCall request property "waterfall" should be a boolean.',
      },
    },
    strictFilters: {
      type: 'boolean',
      description:
        'Routed endpoints: true refuses with a 422 (nothing charged) instead of answering from a provider that could not apply a filter (X-Treg-Route-Strict-Filters).',
      errorMessage: {
        type: 'TregCall request property "strictFilters" should be a boolean.',
      },
    },
    meta: createMetaSchema({ owner: 'TregCall request property' }),
    await: {
      type: 'object',
      description:
        'Wait for an async task (a 202 with an X-Treg-Async poll descriptor) to finish, polling it within timeoutMs.',
      properties: {
        timeoutMs: {
          type: 'integer',
          minimum: 100,
          maximum: 900000,
          default: 60000,
          description: 'How long to poll before giving up, in ms. Defaults to 60000.',
        },
        intervalMs: {
          type: 'integer',
          minimum: 100,
          maximum: 300000,
          description:
            "The wait between polls, in ms. Defaults to the descriptor's interval, or 2000.",
        },
      },
      additionalProperties: false,
      errorMessage: {
        type: 'TregCall request property "await" should be an object.',
        additionalProperties:
          'TregCall request property "await" should only have "timeoutMs" and "intervalMs".',
        properties: {
          timeoutMs:
            'TregCall request property "await.timeoutMs" should be an integer from 100 to 900000.',
          intervalMs:
            'TregCall request property "await.intervalMs" should be an integer from 100 to 300000.',
        },
      },
    },
  },
  additionalProperties: false,
  oneOf: [
    {
      required: ['endpoint'],
      not: { anyOf: [{ required: ['tool'] }, { required: ['path'] }] },
    },
    {
      required: ['tool', 'path'],
      not: { required: ['endpoint'] },
    },
  ],
  errorMessage: {
    type: 'TregCall request properties should be an object.',
    additionalProperties:
      'TregCall request should only have "endpoint", "tool", "path", "method", "query", "body", "idempotencyKey", "maxCost", "maxAge", "noCache", "waterfall", "strictFilters", "meta" and "await".',
    oneOf: 'TregCall request should have either "endpoint", or "tool" and "path".',
  },
};
