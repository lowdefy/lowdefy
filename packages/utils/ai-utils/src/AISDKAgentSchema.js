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
  title: 'Lowdefy Agent Schema - AISDKAgent',
  type: 'object',
  required: ['model'],
  properties: {
    model: {
      type: 'string',
      description: 'Model identifier (e.g. "claude-3-5-sonnet", "gpt-4o", "gemini-1.5-pro").',
      errorMessage: {
        type: 'AISDKAgent agent property "model" should be a string.',
      },
    },
    instructions: {
      type: 'string',
      description: 'System instructions for the agent.',
      errorMessage: {
        type: 'AISDKAgent agent property "instructions" should be a string.',
      },
    },
    maxSteps: {
      type: 'integer',
      minimum: 1,
      description: 'Maximum number of agentic steps.',
      errorMessage: {
        type: 'AISDKAgent agent property "maxSteps" should be an integer.',
        minimum: 'AISDKAgent agent property "maxSteps" should be at least 1.',
      },
    },
    maxOutputTokens: {
      type: 'integer',
      minimum: 1,
      description: 'Maximum number of output tokens.',
      errorMessage: {
        type: 'AISDKAgent agent property "maxOutputTokens" should be an integer.',
        minimum: 'AISDKAgent agent property "maxOutputTokens" should be at least 1.',
      },
    },
    temperature: {
      type: 'number',
      minimum: 0,
      maximum: 2,
      description: 'Sampling temperature between 0 and 2.',
      errorMessage: {
        type: 'AISDKAgent agent property "temperature" should be a number.',
        minimum: 'AISDKAgent agent property "temperature" should be at least 0.',
        maximum: 'AISDKAgent agent property "temperature" should be at most 2.',
      },
    },
    toolChoice: {
      description: 'Tool choice configuration.',
    },
    providerOptions: {
      type: 'object',
      description: 'Provider-specific options passed to the AI SDK.',
      errorMessage: {
        type: 'AISDKAgent agent property "providerOptions" should be an object.',
      },
    },
  },
  errorMessage: {
    type: 'AISDKAgent agent properties should be an object.',
    required: {
      model: 'AISDKAgent agent should have required property "model".',
    },
  },
};
