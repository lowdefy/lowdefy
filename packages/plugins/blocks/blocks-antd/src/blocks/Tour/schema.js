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

const schema = {
  type: 'object',
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      animated: {
        type: 'boolean',
        default: true,
        description: 'Whether to enable animation.',
      },
      arrow: {
        type: ['boolean', 'object'],
        default: true,
        description: 'Whether to show the arrow.',
      },
      closable: {
        type: 'boolean',
        default: true,
        description: 'Whether the close button is visible.',
      },
      current: {
        type: 'integer',
        description: 'Current step index.',
      },
      disabledInteraction: {
        type: 'boolean',
        default: false,
        description: 'Whether to disable interaction with the page while the tour is active.',
      },
      gap: {
        type: 'object',
        description: 'Gap offset between highlighted area and target element.',
        additionalProperties: false,
        properties: {
          x: {
            type: 'number',
            description: 'Horizontal gap offset.',
          },
          y: {
            type: 'number',
            description: 'Vertical gap offset.',
          },
        },
      },
      keyboard: {
        type: 'boolean',
        default: true,
        description: 'Whether to enable keyboard navigation.',
      },
      mask: {
        type: ['boolean', 'object'],
        default: true,
        description: 'Whether to enable mask.',
      },
      open: {
        type: 'boolean',
        default: false,
        description: 'Whether to show the tour.',
      },
      placement: {
        type: 'string',
        description: 'Position of the guide card relative to the target element.',
      },
      scrollIntoViewOptions: {
        type: 'boolean',
        default: true,
        description: 'Whether to scroll the step target element into view.',
      },
      steps: {
        type: 'array',
        description:
          'Tour steps. Each step has title, description, target (blockId string), placement, etc.',
        items: {
          type: 'object',
          properties: {
            closable: {
              type: 'boolean',
              description: 'Whether the close button is visible for this step.',
            },
            cover: {
              type: 'string',
              description: 'Cover image URL for the step.',
            },
            description: {
              type: 'string',
              description: 'Description of the step.',
            },
            mask: {
              type: 'boolean',
              description: 'Whether to enable mask for this step.',
            },
            placement: {
              type: 'string',
              description: 'Position of the guide card relative to the target element.',
            },
            target: {
              type: 'string',
              description: 'The blockId of the target element for this step.',
            },
            title: {
              type: 'string',
              description: 'Title of the step.',
            },
          },
        },
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
        },
      },
      type: {
        type: 'string',
        enum: ['default', 'primary'],
        default: 'default',
        description: 'Type of the tour.',
      },
      zIndex: {
        type: 'integer',
        description: 'Z-index of the tour.',
      },
    },
  },
  events: {
    onChange: {
      description: 'Triggered when the current step changes.',
    },
    onClose: {
      description: 'Triggered when the tour is closed.',
    },
    onFinish: {
      description: 'Triggered when the tour finishes (all steps completed).',
    },
  },
  cssKeys: ['element'],
};

export default schema;
