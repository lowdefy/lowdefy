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
  title: 'Lowdefy Request Schema - Redis',
  type: 'object',
  properties: {
    command: {
      type: 'string',
      description: 'Redis command to execute.',
      errorMessage: {
        type: 'Redis request property "command" should be a string.',
      },
    },
    parameters: {
      type: 'array',
      description: 'The parameters to use with the command.',
      errorMessage: {
        type: 'Redis request property "parameters" should be an array.',
      },
    },
    modifiers: {
      type: 'object',
      description: 'The modifiers to use with the command.',
      default: {},
      errorMessage: {
        type: 'Redis request property "modifiers" should be an object.',
      },
    },
  },
  required: ['command'],
  errorMessage: {
    type: 'Redis request properties should be an object.',
  },
};
