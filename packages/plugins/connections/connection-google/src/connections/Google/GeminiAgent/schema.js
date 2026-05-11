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
  title: 'Lowdefy Agent Schema - GeminiAgent',
  type: 'object',
  required: ['model'],
  properties: {
    model: {
      type: 'string',
      description: 'Google model identifier (e.g. "gemini-1.5-pro").',
      errorMessage: {
        type: 'GeminiAgent agent property "model" should be a string.',
      },
    },
    instructions: {
      type: 'string',
      description: 'System instructions for the agent.',
      errorMessage: {
        type: 'GeminiAgent agent property "instructions" should be a string.',
      },
    },
    maxSteps: {
      type: 'integer',
      minimum: 1,
      description: 'Maximum number of agentic steps.',
      errorMessage: {
        type: 'GeminiAgent agent property "maxSteps" should be an integer.',
        minimum: 'GeminiAgent agent property "maxSteps" should be at least 1.',
      },
    },
    maxOutputTokens: {
      type: 'integer',
      minimum: 1,
      description: 'Maximum number of output tokens.',
      errorMessage: {
        type: 'GeminiAgent agent property "maxOutputTokens" should be an integer.',
        minimum: 'GeminiAgent agent property "maxOutputTokens" should be at least 1.',
      },
    },
    temperature: {
      type: 'number',
      minimum: 0,
      maximum: 2,
      description: 'Sampling temperature between 0 and 2.',
      errorMessage: {
        type: 'GeminiAgent agent property "temperature" should be a number.',
        minimum: 'GeminiAgent agent property "temperature" should be at least 0.',
        maximum: 'GeminiAgent agent property "temperature" should be at most 2.',
      },
    },
    toolChoice: {
      description: 'Tool choice configuration.',
    },
    thinkingConfig: {
      type: 'object',
      description: 'Configuration for the model thinking process.',
      properties: {
        thinkingBudget: {
          type: 'integer',
          minimum: 0,
          description: 'Maximum thinking tokens (Gemini 2.5 models). Set to 0 to disable.',
        },
        thinkingLevel: {
          type: 'string',
          enum: ['minimal', 'low', 'medium', 'high'],
          description: 'Thinking depth (Gemini 3 models).',
        },
        includeThoughts: {
          type: 'boolean',
          description: 'If true, return thought summaries in the response.',
        },
      },
      errorMessage: {
        type: 'GeminiAgent agent property "thinkingConfig" should be an object.',
      },
    },
    safetySettings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Safety category (e.g. "HARM_CATEGORY_DANGEROUS_CONTENT").',
          },
          threshold: {
            type: 'string',
            description: 'Block threshold (e.g. "BLOCK_ONLY_HIGH", "BLOCK_NONE").',
          },
        },
      },
      description: 'Safety settings for the model.',
      errorMessage: {
        type: 'GeminiAgent agent property "safetySettings" should be an array.',
      },
    },
    providerOptions: {
      type: 'object',
      description: 'Provider-specific options passed to the AI SDK.',
      errorMessage: {
        type: 'GeminiAgent agent property "providerOptions" should be an object.',
      },
    },
  },
  errorMessage: {
    type: 'GeminiAgent agent properties should be an object.',
    required: {
      model: 'GeminiAgent agent should have required property "model".',
    },
  },
};
