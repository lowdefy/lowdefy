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
  title: 'Lowdefy Request Schema - GenerateText',
  type: 'object',
  required: ['model'],
  properties: {
    model: {
      type: 'string',
      description: 'Model id to generate with.',
      errorMessage: {
        type: 'GenerateText request property "model" should be a string.',
      },
    },
    prompt: {
      type: 'string',
      description: 'Text prompt. Use either "prompt" or "messages", not both.',
      errorMessage: {
        type: 'GenerateText request property "prompt" should be a string.',
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
        type: 'GenerateText request property "messages" should be an array of objects.',
      },
    },
    system: {
      type: 'string',
      description: 'System prompt.',
      errorMessage: {
        type: 'GenerateText request property "system" should be a string.',
      },
    },
    maxOutputTokens: {
      type: 'integer',
      minimum: 1,
      description: 'Maximum number of tokens to generate.',
      errorMessage: {
        type: 'GenerateText request property "maxOutputTokens" should be an integer.',
        minimum: 'GenerateText request property "maxOutputTokens" should be at least 1.',
      },
    },
    temperature: {
      type: 'number',
      minimum: 0,
      maximum: 2,
      description: 'Sampling temperature.',
      errorMessage: {
        type: 'GenerateText request property "temperature" should be a number.',
        minimum: 'GenerateText request property "temperature" should be at least 0.',
        maximum: 'GenerateText request property "temperature" should be at most 2.',
      },
    },
    topP: {
      type: 'number',
      description: 'Nucleus sampling.',
      errorMessage: {
        type: 'GenerateText request property "topP" should be a number.',
      },
    },
    topK: {
      type: 'number',
      description: 'Only sample from the top K options for each subsequent token.',
      errorMessage: {
        type: 'GenerateText request property "topK" should be a number.',
      },
    },
    frequencyPenalty: {
      type: 'number',
      description: 'Penalize repeated tokens by frequency.',
      errorMessage: {
        type: 'GenerateText request property "frequencyPenalty" should be a number.',
      },
    },
    presencePenalty: {
      type: 'number',
      description: 'Penalize tokens that have already appeared.',
      errorMessage: {
        type: 'GenerateText request property "presencePenalty" should be a number.',
      },
    },
    seed: {
      type: 'integer',
      description: 'Seed for deterministic sampling, if supported by the model.',
      errorMessage: {
        type: 'GenerateText request property "seed" should be an integer.',
      },
    },
    stopSequences: {
      type: 'array',
      items: {
        type: 'string',
      },
      description: 'Sequences that stop generation.',
      errorMessage: {
        type: 'GenerateText request property "stopSequences" should be an array of strings.',
      },
    },
    maxRetries: {
      type: 'integer',
      minimum: 0,
      description: 'Maximum number of retries. Defaults to 2.',
      errorMessage: {
        type: 'GenerateText request property "maxRetries" should be an integer.',
        minimum: 'GenerateText request property "maxRetries" should be at least 0.',
      },
    },
    providerOptions: {
      type: 'object',
      description: 'Provider-specific options, keyed by provider.',
      errorMessage: {
        type: 'GenerateText request property "providerOptions" should be an object.',
      },
    },
  },
  errorMessage: {
    type: 'GenerateText request properties should be an object.',
    required: {
      model: 'GenerateText request should have required property "model".',
    },
  },
};
