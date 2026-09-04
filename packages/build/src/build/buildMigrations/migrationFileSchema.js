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

// Only shapes the top level of a migrations/*.yaml file: "name" and "routine"
// are the only keys a migration declares, so a typo (e.g. "routines:") is
// caught here rather than silently producing an undefined routine that
// buildRoutine then rejects with a less specific error. The routine's own
// steps are validated by buildRoutine, which runs a migration through the
// same checks an endpoint's routine gets.
const migrationFileSchema = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      errorMessage: 'Migration "name" should be a string.',
    },
    routine: {
      anyOf: [{ type: 'array' }, { type: 'object' }],
      errorMessage: 'Migration "routine" should be an array or an object.',
    },
  },
  required: ['routine'],
  additionalProperties: false,
  errorMessage: {
    type: 'A migration file should be a map.',
    required: {
      routine: 'A migration file requires a "routine".',
    },
    additionalProperties:
      'A migration file has an unknown property. The only allowed properties are "name" and "routine".',
  },
};

export default migrationFileSchema;
