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
  title: 'Lowdefy Agent Schema - ClaudeAgent',
  type: 'object',
  required: ['model'],
  properties: {
    model: {
      type: 'string',
      description: 'Anthropic model identifier (e.g. "claude-3-5-sonnet-20241022").',
      errorMessage: {
        type: 'ClaudeAgent agent property "model" should be a string.',
      },
    },
    instructions: {
      type: 'string',
      description: 'System instructions for the agent.',
      errorMessage: {
        type: 'ClaudeAgent agent property "instructions" should be a string.',
      },
    },
    maxSteps: {
      type: 'integer',
      minimum: 1,
      description: 'Maximum number of agentic steps.',
      errorMessage: {
        type: 'ClaudeAgent agent property "maxSteps" should be an integer.',
        minimum: 'ClaudeAgent agent property "maxSteps" should be at least 1.',
      },
    },
    maxOutputTokens: {
      type: 'integer',
      minimum: 1,
      description: 'Maximum number of output tokens.',
      errorMessage: {
        type: 'ClaudeAgent agent property "maxOutputTokens" should be an integer.',
        minimum: 'ClaudeAgent agent property "maxOutputTokens" should be at least 1.',
      },
    },
    temperature: {
      type: 'number',
      minimum: 0,
      maximum: 2,
      description: 'Sampling temperature between 0 and 2.',
      errorMessage: {
        type: 'ClaudeAgent agent property "temperature" should be a number.',
        minimum: 'ClaudeAgent agent property "temperature" should be at least 0.',
        maximum: 'ClaudeAgent agent property "temperature" should be at most 2.',
      },
    },
    toolChoice: {
      description: 'Tool choice configuration.',
    },
    thinking: {
      type: 'object',
      description:
        'Anthropic extended thinking configuration (e.g. { type: "enabled", budgetTokens: 10000 }).',
      errorMessage: {
        type: 'ClaudeAgent agent property "thinking" should be an object.',
      },
    },
    effort: {
      type: 'string',
      enum: ['low', 'medium', 'high'],
      description: 'Anthropic thinking effort level.',
      errorMessage: {
        type: 'ClaudeAgent agent property "effort" should be a string.',
        enum: 'ClaudeAgent agent property "effort" should be one of "low", "medium", or "high".',
      },
    },
    providerOptions: {
      type: 'object',
      description: 'Provider-specific options passed to the AI SDK.',
      errorMessage: {
        type: 'ClaudeAgent agent property "providerOptions" should be an object.',
      },
    },
    repairToolCall: {
      type: 'boolean',
      description:
        'Enable automatic tool call repair. When the model generates invalid tool input, the error is sent back to the model for self-correction.',
      errorMessage: {
        type: 'ClaudeAgent agent property "repairToolCall" should be a boolean.',
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
        type: 'ClaudeAgent agent property "prepareStep" should be an array of step rules.',
      },
    },
  },
  errorMessage: {
    type: 'ClaudeAgent agent properties should be an object.',
    required: {
      model: 'ClaudeAgent agent should have required property "model".',
    },
  },
};
