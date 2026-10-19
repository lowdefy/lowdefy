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
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Connection Schema - Anthropic',
  type: 'object',
  required: ['apiKey'],
  properties: {
    apiKey: {
      type: 'string',
      description: 'Anthropic API key.',
      errorMessage: {
        type: 'Anthropic connection property "apiKey" should be a string.',
      },
    },
    baseURL: {
      type: 'string',
      description: 'Optional base URL for the Anthropic API.',
      errorMessage: {
        type: 'Anthropic connection property "baseURL" should be a string.',
      },
    },
    maxOutputTokens: {
      type: 'integer',
      minimum: 1,
      description:
        'Default maximum number of tokens a model call generates, for the requests and agents on this connection that do not set their own.',
      errorMessage: {
        type: 'Anthropic connection property "maxOutputTokens" should be an integer.',
        minimum: 'Anthropic connection property "maxOutputTokens" should be at least 1.',
      },
    },
    timeout: {
      type: 'integer',
      minimum: 1,
      description:
        'Default milliseconds a model call may take, retries included, before it is cancelled, for the requests and agents on this connection that do not set their own.',
      errorMessage: {
        type: 'Anthropic connection property "timeout" should be an integer.',
        minimum: 'Anthropic connection property "timeout" should be at least 1.',
      },
    },
  },
  errorMessage: {
    type: 'Anthropic connection properties should be an object.',
    required: {
      apiKey: 'Anthropic connection should have required property "apiKey".',
    },
  },
};
