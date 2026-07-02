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
  title: 'Lowdefy Request Schema - GenerateObject',
  type: 'object',
  required: ['model', 'schema'],
  properties: {
    model: {
      type: 'string',
      description: 'Model id to generate with.',
      errorMessage: {
        type: 'GenerateObject request property "model" should be a string.',
      },
    },
    schema: {
      type: 'object',
      description: 'JSON Schema describing the object the model must generate.',
      errorMessage: {
        type: 'GenerateObject request property "schema" should be an object.',
      },
    },
    schemaName: {
      type: 'string',
      description: 'Optional name for the output schema, passed to the model.',
      errorMessage: {
        type: 'GenerateObject request property "schemaName" should be a string.',
      },
    },
    schemaDescription: {
      type: 'string',
      description: 'Optional description of the output schema, passed to the model.',
      errorMessage: {
        type: 'GenerateObject request property "schemaDescription" should be a string.',
      },
    },
    prompt: {
      type: 'string',
      description: 'Text prompt. Use either "prompt" or "messages", not both.',
      errorMessage: {
        type: 'GenerateObject request property "prompt" should be a string.',
      },
    },
    messages: {
      type: 'array',
      items: {
        type: 'object',
      },
      description:
        'Model messages ({ role, content }). Use either "prompt" or "messages", not both.',
      errorMessage: {
        type: 'GenerateObject request property "messages" should be an array of objects.',
      },
    },
    system: {
      type: 'string',
      description: 'System prompt.',
      errorMessage: {
        type: 'GenerateObject request property "system" should be a string.',
      },
    },
    maxOutputTokens: {
      type: 'integer',
      minimum: 1,
      description: 'Maximum number of tokens to generate.',
      errorMessage: {
        type: 'GenerateObject request property "maxOutputTokens" should be an integer.',
        minimum: 'GenerateObject request property "maxOutputTokens" should be at least 1.',
      },
    },
    temperature: {
      type: 'number',
      minimum: 0,
      maximum: 2,
      description: 'Sampling temperature.',
      errorMessage: {
        type: 'GenerateObject request property "temperature" should be a number.',
        minimum: 'GenerateObject request property "temperature" should be at least 0.',
        maximum: 'GenerateObject request property "temperature" should be at most 2.',
      },
    },
    topP: {
      type: 'number',
      description: 'Nucleus sampling.',
      errorMessage: {
        type: 'GenerateObject request property "topP" should be a number.',
      },
    },
    topK: {
      type: 'number',
      description: 'Only sample from the top K options for each subsequent token.',
      errorMessage: {
        type: 'GenerateObject request property "topK" should be a number.',
      },
    },
    frequencyPenalty: {
      type: 'number',
      description: 'Penalize repeated tokens by frequency.',
      errorMessage: {
        type: 'GenerateObject request property "frequencyPenalty" should be a number.',
      },
    },
    presencePenalty: {
      type: 'number',
      description: 'Penalize tokens that have already appeared.',
      errorMessage: {
        type: 'GenerateObject request property "presencePenalty" should be a number.',
      },
    },
    seed: {
      type: 'integer',
      description: 'Seed for deterministic sampling, if supported by the model.',
      errorMessage: {
        type: 'GenerateObject request property "seed" should be an integer.',
      },
    },
    maxRetries: {
      type: 'integer',
      minimum: 0,
      description: 'Maximum number of retries. Defaults to 2.',
      errorMessage: {
        type: 'GenerateObject request property "maxRetries" should be an integer.',
        minimum: 'GenerateObject request property "maxRetries" should be at least 0.',
      },
    },
    providerOptions: {
      type: 'object',
      description: 'Provider-specific options, keyed by provider.',
      errorMessage: {
        type: 'GenerateObject request property "providerOptions" should be an object.',
      },
    },
  },
  errorMessage: {
    type: 'GenerateObject request properties should be an object.',
    required: {
      model: 'GenerateObject request should have required property "model".',
      schema: 'GenerateObject request should have required property "schema".',
    },
  },
};
