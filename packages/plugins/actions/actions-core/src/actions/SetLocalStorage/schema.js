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
    type: 'object',
    required: ['key', 'value'],
    properties: {
      key: {
        type: 'string',
        minLength: 1,
        pattern: '^(?!lowdefy_|lf-)',
        description:
          'The local storage key to write to. Keys starting with "lowdefy_" or "lf-" are reserved for Lowdefy.',
      },
      value: {
        description:
          'The value to store. Values are serialized, so dates are preserved when read back with GetLocalStorage.',
      },
    },
    additionalProperties: false,
  },
};
