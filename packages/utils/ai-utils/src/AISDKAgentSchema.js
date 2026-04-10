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
    stopOnToolCall: {
      oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' }, minItems: 1 }],
      description:
        'Stop the agent loop when a tool with this name is called. Can be a single tool name or an array of tool names.',
      errorMessage: {
        oneOf:
          'AISDKAgent agent property "stopOnToolCall" should be a string or an array of strings.',
      },
    },
    activeTools: {
      type: 'array',
      items: { type: 'string' },
      description: 'Restrict which tools are available to the model in each step.',
      errorMessage: {
        type: 'AISDKAgent agent property "activeTools" should be an array of strings.',
      },
    },
    topP: {
      type: 'number',
      minimum: 0,
      maximum: 1,
      description: 'Nucleus sampling probability between 0 and 1.',
      errorMessage: {
        type: 'AISDKAgent agent property "topP" should be a number.',
        minimum: 'AISDKAgent agent property "topP" should be at least 0.',
        maximum: 'AISDKAgent agent property "topP" should be at most 1.',
      },
    },
    topK: {
      type: 'integer',
      minimum: 1,
      description: 'Only sample from top K options for each token.',
      errorMessage: {
        type: 'AISDKAgent agent property "topK" should be an integer.',
        minimum: 'AISDKAgent agent property "topK" should be at least 1.',
      },
    },
    frequencyPenalty: {
      type: 'number',
      minimum: -1,
      maximum: 1,
      description: 'Frequency penalty between -1 and 1. 0 means no penalty.',
      errorMessage: {
        type: 'AISDKAgent agent property "frequencyPenalty" should be a number.',
        minimum: 'AISDKAgent agent property "frequencyPenalty" should be at least -1.',
        maximum: 'AISDKAgent agent property "frequencyPenalty" should be at most 1.',
      },
    },
    presencePenalty: {
      type: 'number',
      minimum: -1,
      maximum: 1,
      description: 'Presence penalty between -1 and 1. 0 means no penalty.',
      errorMessage: {
        type: 'AISDKAgent agent property "presencePenalty" should be a number.',
        minimum: 'AISDKAgent agent property "presencePenalty" should be at least -1.',
        maximum: 'AISDKAgent agent property "presencePenalty" should be at most 1.',
      },
    },
    seed: {
      type: 'integer',
      description: 'Seed for deterministic random sampling.',
      errorMessage: {
        type: 'AISDKAgent agent property "seed" should be an integer.',
      },
    },
    stopSequences: {
      type: 'array',
      items: { type: 'string' },
      description: 'Stop sequences. Generation stops when one is produced.',
      errorMessage: {
        type: 'AISDKAgent agent property "stopSequences" should be an array of strings.',
      },
    },
    maxRetries: {
      type: 'integer',
      minimum: 0,
      description: 'Maximum number of retries. Set to 0 to disable retries. Default is 2.',
      errorMessage: {
        type: 'AISDKAgent agent property "maxRetries" should be an integer.',
        minimum: 'AISDKAgent agent property "maxRetries" should be at least 0.',
      },
    },
    timeout: {
      oneOf: [
        { type: 'number', minimum: 0 },
        {
          type: 'object',
          properties: {
            totalMs: { type: 'number', minimum: 0 },
            stepMs: { type: 'number', minimum: 0 },
            chunkMs: { type: 'number', minimum: 0 },
          },
          additionalProperties: false,
        },
      ],
      description: 'Timeout in milliseconds, or an object with totalMs, stepMs, and/or chunkMs.',
      errorMessage: {
        oneOf:
          'AISDKAgent agent property "timeout" should be a number or an object with totalMs, stepMs, and/or chunkMs.',
      },
    },
    repairToolCall: {
      type: 'boolean',
      description:
        'Enable automatic tool call repair. When the model generates invalid tool input, the error is sent back to the model for self-correction.',
      errorMessage: {
        type: 'AISDKAgent agent property "repairToolCall" should be a boolean.',
      },
    },
    prepareStep: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          steps: {
            type: 'array',
            items: { type: 'integer', minimum: 1 },
            description: 'Specific step numbers this rule applies to.',
          },
          from: {
            type: 'integer',
            minimum: 1,
            description: 'Start of step range (inclusive).',
          },
          to: {
            type: 'integer',
            minimum: 1,
            description: 'End of step range (inclusive). Omit for open-ended.',
          },
          activeTools: {
            type: 'array',
            items: { type: 'string' },
            description: 'Restrict available tools for matching steps.',
          },
          toolChoice: {
            description: 'Override tool choice for matching steps.',
          },
          maxOutputTokens: {
            type: 'integer',
            minimum: 1,
            description: 'Override max output tokens for matching steps.',
          },
          temperature: {
            type: 'number',
            minimum: 0,
            maximum: 2,
            description: 'Override temperature for matching steps.',
          },
        },
      },
      description:
        'Rules for dynamic per-step configuration. First matching rule wins. Use steps array or from/to range.',
      errorMessage: {
        type: 'AISDKAgent agent property "prepareStep" should be an array of step rules.',
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
