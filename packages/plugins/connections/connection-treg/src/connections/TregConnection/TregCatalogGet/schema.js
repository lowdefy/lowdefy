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

import endpointIdPattern from '../endpointIdPattern.js';

export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - TregCatalogGet',
  type: 'object',
  required: ['endpoint'],
  properties: {
    endpoint: {
      type: 'string',
      pattern: endpointIdPattern,
      maxLength: 200,
      description: 'The catalog or routed endpoint id, such as "treg.people.email.find".',
      errorMessage: {
        type: 'TregCatalogGet request property "endpoint" should be a string.',
        pattern:
          'TregCatalogGet request property "endpoint" should be a treg endpoint id of lowercase letters, digits, ".", "_" and "-".',
        maxLength: 'TregCatalogGet request property "endpoint" should be at most 200 characters.',
      },
    },
    access: {
      type: 'boolean',
      description:
        'Also read how this team would be served and at what price (estimated_cost_usd), from /catalog/endpoints/<id>/access.',
      errorMessage: {
        type: 'TregCatalogGet request property "access" should be a boolean.',
      },
    },
  },
  additionalProperties: false,
  errorMessage: {
    type: 'TregCatalogGet request properties should be an object.',
    required: {
      endpoint: 'TregCatalogGet request should have required property "endpoint".',
    },
    additionalProperties: 'TregCatalogGet request should only have "endpoint" and "access".',
  },
};
