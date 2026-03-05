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
  type: 'object',
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      layout: {
        type: 'string',
        enum: ['horizontal', 'vertical'],
        default: 'horizontal',
        description: 'Layout direction of the splitter.',
      },
      panels: {
        type: 'array',
        description:
          'Panel configuration array. Each panel has key, size, min, max, defaultSize, collapsible, resizable.',
        items: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              description: 'Unique panel key, used to match content slots.',
            },
            size: {
              type: ['number', 'string'],
              description: 'Controlled panel size.',
            },
            min: {
              type: ['number', 'string'],
              description: 'Minimum size threshold.',
            },
            max: {
              type: ['number', 'string'],
              description: 'Maximum size threshold.',
            },
            defaultSize: {
              type: ['number', 'string'],
              description: 'Default panel size.',
            },
            collapsible: {
              type: ['boolean', 'object'],
              description: 'Whether the panel is collapsible.',
            },
            resizable: {
              type: 'boolean',
              default: true,
              description: 'Whether the panel is resizable.',
            },
          },
        },
      },
    },
  },
};
