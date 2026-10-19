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
  type: 'object',
  params: {
    oneOf: [
      {
        type: 'string',
        description:
          'Name of the path placeholder to return, or a dot-notation path into the values.',
      },
      { type: 'boolean', enum: [true], description: 'Return all path params.' },
      {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            description:
              'Name of the path placeholder to return, or a dot-notation path into the values.',
          },
          default: {
            description: 'Default value if key does not exist.',
          },
          all: {
            type: 'boolean',
            description: 'Return all path params.',
          },
        },
        additionalProperties: false,
      },
    ],
  },
};
