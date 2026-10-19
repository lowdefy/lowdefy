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

import createMetaSchema from './createMetaSchema.js';

export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Connection Schema - TregConnection',
  type: 'object',
  required: ['token'],
  properties: {
    token: {
      type: 'string',
      minLength: 1,
      description:
        'The treg token, sent as X-Treg-Token. Use a per-team token (it carries its team), and store it with _secret.',
      errorMessage: {
        type: 'TregConnection property "token" should be a string.',
        minLength: 'TregConnection property "token" should not be empty.',
      },
    },
    org: {
      type: 'string',
      minLength: 1,
      description:
        'The team slug, sent as X-Treg-Org. Only needed with an identity token (from "treg login").',
      errorMessage: {
        type: 'TregConnection property "org" should be a string.',
        minLength: 'TregConnection property "org" should not be empty.',
      },
    },
    baseUrl: {
      type: 'string',
      default: 'https://treg.to',
      // https for any host; plain http only on the loopback host, for a local self-hosted
      // treg or a test server.
      pattern:
        '^(https://[^/?#\\s@]+|http://(localhost|127\\.0\\.0\\.1|\\[::1\\])(:[0-9]{1,5})?)(/[^?#\\s]*)?$',
      description:
        'The treg base URL, for self-hosted treg. An https URL, or http on localhost. Defaults to https://treg.to.',
      errorMessage: {
        type: 'TregConnection property "baseUrl" should be a string.',
        pattern:
          'TregConnection property "baseUrl" should be an https URL (http is only allowed on localhost), with no query or credentials.',
      },
    },
    timeout: {
      type: 'integer',
      minimum: 1,
      default: 30000,
      description: 'The time in ms each HTTP call to treg may take.',
      errorMessage: {
        type: 'TregConnection property "timeout" should be an integer.',
        minimum: 'TregConnection property "timeout" should be at least 1.',
      },
    },
    maxCost: {
      type: 'number',
      minimum: 0,
      description:
        'The default spend ceiling per call in USD, sent as X-Treg-Route-Max-Cost. treg refuses a call whose reserve would exceed it, and charges nothing. A request maxCost overrides it.',
      errorMessage: {
        type: 'TregConnection property "maxCost" should be a number.',
        minimum: 'TregConnection property "maxCost" should be at least 0.',
      },
    },
    meta: createMetaSchema({ owner: 'TregConnection property' }),
    allowCustomTools: {
      type: 'boolean',
      default: false,
      description:
        'Allow TregCall to call the team\'s own registered tools with "tool" and "path". Off by default, so a request can only reach catalog and routed endpoints.',
      errorMessage: {
        type: 'TregConnection property "allowCustomTools" should be a boolean.',
      },
    },
  },
  additionalProperties: false,
  errorMessage: {
    type: 'TregConnection properties should be an object.',
    required: {
      token: 'TregConnection should have required property "token".',
    },
    additionalProperties:
      'TregConnection should only have "token", "org", "baseUrl", "timeout", "maxCost", "meta" and "allowCustomTools".',
  },
};
