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

export default {
  category: 'container',
  icons: [],
  valueType: null,
  slots: {
    content: 'Server-resolved blocks — filled at page get, do not define in config.',
    fallback: 'Blocks rendered when resolution fails and required is false.',
  },
  cssKeys: {
    element: 'The Dynamic element.',
  },
  events: {
    onClick: 'Trigger actions when the Dynamic container is clicked.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      endpointId: {
        type: 'string',
        description:
          'Required. The api endpoint that resolves this block content at page get. InternalApi endpoints are recommended.',
      },
      params: {
        type: 'object',
        description:
          'Static values passed to the endpoint payload as params. Operators are not allowed — read runtime values in the endpoint routine with _payload, _user or _secret.',
      },
      required: {
        type: 'boolean',
        default: false,
        description:
          'When true, a resolution failure fails the whole page request instead of rendering the fallback slot.',
      },
      types: {
        type: 'object',
        description:
          'Extra block, action and operator types the endpoint may return, so build includes them in the client bundle.',
        additionalProperties: false,
        properties: {
          blocks: {
            type: 'array',
            items: { type: 'string' },
            description: 'Block types the endpoint may return.',
          },
          actions: {
            type: 'array',
            items: { type: 'string' },
            description: 'Action types the endpoint may return.',
          },
          operators: {
            type: 'array',
            items: { type: 'string' },
            description: 'Client operator types the endpoint may return.',
          },
        },
      },
    },
  },
};
