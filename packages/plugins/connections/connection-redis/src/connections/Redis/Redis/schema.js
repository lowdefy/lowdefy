/*
  Copyright 2020-2021 Lowdefy, Inc

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
      enum: ['get', 'set', 'hget', 'hset'],
      description: 'Redis command to execute.',
      errorMessage: {
        type: 'Redis request property "command" should be a string.',
        enum: 'Redis request property "command" is not a valid value.',
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
  if: {
    properties: { command: { enum: ['get'] } },
  },
  then: {
    properties: {
      params: {
        type: 'string',
        errorMessage: {
          type: 'Redis request property "params" should be a string.',
        },
      },
    },
    required: ['params'],
    errorMessage: {
      required: 'Redis request property "params" should be present.',
    },
  },
  else: {
    properties: {
      params: {
        type: 'array',
        errorMessage: {
          type: 'Redis request property "params" should be an array.',
        },
      },
    },
    required: ['params'],
    errorMessage: {
      required: 'Redis request property "params" should be present.',
    },
  },
  errorMessage: {
    type: 'Redis request properties should be an object.',
  },
};
