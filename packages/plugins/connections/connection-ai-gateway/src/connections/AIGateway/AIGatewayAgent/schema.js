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
  title: 'Lowdefy Agent Schema - AIGatewayAgent',
  type: 'object',
  required: ['model'],
  properties: {
    model: {
      type: 'string',
      description:
        'Gateway model identifier in "creator/model" form (e.g. "anthropic/claude-sonnet-4.5", "openai/gpt-5-mini").',
      errorMessage: {
        type: 'AIGatewayAgent agent property "model" should be a string.',
      },
    },
    instructions: {
      type: 'string',
      description: 'System instructions for the agent.',
      errorMessage: {
        type: 'AIGatewayAgent agent property "instructions" should be a string.',
      },
    },
    maxSteps: {
      type: 'integer',
      minimum: 1,
      description: 'Maximum number of agentic steps.',
      errorMessage: {
        type: 'AIGatewayAgent agent property "maxSteps" should be an integer.',
        minimum: 'AIGatewayAgent agent property "maxSteps" should be at least 1.',
      },
    },
    maxOutputTokens: {
      type: 'integer',
      minimum: 1,
      description: 'Maximum number of output tokens.',
      errorMessage: {
        type: 'AIGatewayAgent agent property "maxOutputTokens" should be an integer.',
        minimum: 'AIGatewayAgent agent property "maxOutputTokens" should be at least 1.',
      },
    },
    temperature: {
      type: 'number',
      minimum: 0,
      maximum: 2,
      description: 'Sampling temperature between 0 and 2.',
      errorMessage: {
        type: 'AIGatewayAgent agent property "temperature" should be a number.',
        minimum: 'AIGatewayAgent agent property "temperature" should be at least 0.',
        maximum: 'AIGatewayAgent agent property "temperature" should be at most 2.',
      },
    },
    toolChoice: {
      description: 'Tool choice configuration.',
    },
    order: {
      type: 'array',
      items: { type: 'string' },
      description:
        'Provider slugs to try in order (e.g. ["vertex", "anthropic"]). Gateway attempts providers in sequence until one succeeds.',
      errorMessage: {
        type: 'AIGatewayAgent agent property "order" should be an array of strings.',
      },
    },
    only: {
      type: 'array',
      items: { type: 'string' },
      description: 'Restrict routing to only these provider slugs (e.g. ["anthropic", "vertex"]).',
      errorMessage: {
        type: 'AIGatewayAgent agent property "only" should be an array of strings.',
      },
    },
    fallbackModels: {
      type: 'array',
      items: { type: 'string' },
      description:
        'Fallback model ids (creator/model) tried in order when the primary model fails. Mapped to gateway providerOptions "models".',
      errorMessage: {
        type: 'AIGatewayAgent agent property "fallbackModels" should be an array of strings.',
      },
    },
    user: {
      type: 'string',
      description:
        'End-user identifier for spend attribution in the AI Gateway analytics dashboard.',
      errorMessage: {
        type: 'AIGatewayAgent agent property "user" should be a string.',
      },
    },
    tags: {
      type: 'array',
      items: { type: 'string' },
      description: 'Tags used to categorize and filter usage in gateway reports.',
      errorMessage: {
        type: 'AIGatewayAgent agent property "tags" should be an array of strings.',
      },
    },
    zeroDataRetention: {
      type: 'boolean',
      description: 'When true, restrict routing to providers with zero data retention policies.',
      errorMessage: {
        type: 'AIGatewayAgent agent property "zeroDataRetention" should be a boolean.',
      },
    },
    providerTimeouts: {
      type: 'object',
      properties: {
        byok: {
          type: 'object',
          additionalProperties: {
            type: 'integer',
            minimum: 1000,
            errorMessage: {
              type: 'AIGatewayAgent agent property "providerTimeouts.byok" values should be integers in milliseconds.',
              minimum:
                'AIGatewayAgent agent property "providerTimeouts.byok" values should be at least 1000 ms.',
            },
          },
          description:
            'Per-provider BYOK timeouts in milliseconds (minimum 1000), keyed by provider slug.',
        },
      },
      additionalProperties: false,
      description:
        'Per-provider timeouts for BYOK credentials. See Vercel AI Gateway docs for provider slug list.',
      errorMessage: {
        type: 'AIGatewayAgent agent property "providerTimeouts" should be an object.',
      },
    },
    byok: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: {
          type: 'object',
          errorMessage: {
            type: 'AIGatewayAgent agent property "byok" credentials should be objects.',
          },
        },
        errorMessage: {
          type: 'AIGatewayAgent agent property "byok" values should be arrays of credential objects.',
        },
      },
      description:
        'Request-scoped Bring Your Own Key credentials. Keys are provider slugs, values are arrays of credential objects tried in order.',
      errorMessage: {
        type: 'AIGatewayAgent agent property "byok" should be an object.',
      },
    },
    pageContext: {
      type: 'boolean',
      description:
        'When true, prepend page context (pageId, userId, conversationId, urlQuery) to instructions.',
      errorMessage: {
        type: 'AIGatewayAgent agent property "pageContext" should be a boolean.',
      },
    },
    providerOptions: {
      type: 'object',
      description:
        'Provider-specific options passed to the AI SDK. Use the underlying provider slug as the key (e.g. "anthropic", "openai") to pass provider-native options through the gateway.',
      errorMessage: {
        type: 'AIGatewayAgent agent property "providerOptions" should be an object.',
      },
    },
    repairToolCall: {
      type: 'boolean',
      description:
        'Enable automatic tool call repair. When the model generates invalid tool input, the error is sent back to the model for self-correction.',
      errorMessage: {
        type: 'AIGatewayAgent agent property "repairToolCall" should be a boolean.',
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
        type: 'AIGatewayAgent agent property "prepareStep" should be an array of step rules.',
      },
    },
  },
  errorMessage: {
    type: 'AIGatewayAgent agent properties should be an object.',
    required: {
      model: 'AIGatewayAgent agent should have required property "model".',
    },
  },
};
