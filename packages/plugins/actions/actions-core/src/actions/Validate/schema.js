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
        description: 'Shorthand for a single blockId to validate.',
      },
      {
        type: 'array',
        items: { type: 'string' },
        description: 'An array of blockIds to validate.',
      },
      {
        type: 'object',
        additionalProperties: false,
        properties: {
          blockIds: {
            oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
            description: 'A blockId or an array of blockIds to validate.',
          },
          regex: {
            oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
            description:
              'A regex string pattern or an array of regex patterns matched against blockIds to select the blocks to validate.',
          },
          schema: {
            oneOf: [{ const: true }, { type: 'string' }],
            description:
              'Validate the page state against the state contract declared in the page "state" property. true checks the whole contract; a dotted state path checks the fragment declared at that path. Runs in addition to the blocks selected by blockIds or regex. Errors at a path that is a block on the page are shown on that block.',
          },
        },
        description:
          'Select blocks to validate by blockIds or regex, and/or validate state against the page state contract.',
      },
    ],
  },
};
