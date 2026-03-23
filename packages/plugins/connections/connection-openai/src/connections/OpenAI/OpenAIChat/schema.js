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
  title: 'Lowdefy Agent Schema - OpenAIChat',
  type: 'object',
  required: ['model'],
  properties: {
    model: {
      type: 'string',
      description: 'OpenAI model identifier (e.g. "gpt-4o").',
      errorMessage: {
        type: 'OpenAIChat agent property "model" should be a string.',
      },
    },
    instructions: {
      type: 'string',
      description: 'System instructions for the agent.',
      errorMessage: {
        type: 'OpenAIChat agent property "instructions" should be a string.',
      },
    },
    maxSteps: {
      type: 'integer',
      minimum: 1,
      description: 'Maximum number of agentic steps.',
      errorMessage: {
        type: 'OpenAIChat agent property "maxSteps" should be an integer.',
        minimum: 'OpenAIChat agent property "maxSteps" should be at least 1.',
      },
    },
    maxOutputTokens: {
      type: 'integer',
      minimum: 1,
      description: 'Maximum number of output tokens.',
      errorMessage: {
        type: 'OpenAIChat agent property "maxOutputTokens" should be an integer.',
        minimum: 'OpenAIChat agent property "maxOutputTokens" should be at least 1.',
      },
    },
    temperature: {
      type: 'number',
      minimum: 0,
      maximum: 2,
      description: 'Sampling temperature between 0 and 2.',
      errorMessage: {
        type: 'OpenAIChat agent property "temperature" should be a number.',
        minimum: 'OpenAIChat agent property "temperature" should be at least 0.',
        maximum: 'OpenAIChat agent property "temperature" should be at most 2.',
      },
    },
    toolChoice: {
      description: 'Tool choice configuration.',
    },
    providerOptions: {
      type: 'object',
      description: 'Provider-specific options passed to the AI SDK (e.g. OpenAI reasoningEffort).',
      errorMessage: {
        type: 'OpenAIChat agent property "providerOptions" should be an object.',
      },
    },
  },
  errorMessage: {
    type: 'OpenAIChat agent properties should be an object.',
    required: {
      model: 'OpenAIChat agent should have required property "model".',
    },
  },
};
