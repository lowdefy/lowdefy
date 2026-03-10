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
      lazy: {
        type: 'boolean',
        default: false,
        description: 'Lazy render panel content.',
      },
      layout: {
        type: 'string',
        enum: ['horizontal', 'vertical'],
        default: 'horizontal',
        description: 'Layout direction of the splitter.',
      },
      orientation: {
        type: 'string',
        enum: ['horizontal', 'vertical'],
        description:
          'Layout direction of the splitter. Alias for layout, takes precedence if both are set.',
      },
      panels: {
        type: 'array',
        description:
          'Panel configuration array. Each panel has key, size, min, max, defaultSize, collapsible, resizable.',
        docs: {
          displayType: 'yaml',
        },
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
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/splitter#design-token',
        },
        properties: {
          splitBarSize: {
            type: 'number',
            default: 1,
            description: 'Thickness of the divider bar between panels in pixels.',
          },
          splitTriggerSize: {
            type: 'number',
            default: 6,
            description: 'Size of the interactive trigger area for resizing in pixels.',
          },
          splitBarDraggableSize: {
            type: 'number',
            default: 20,
            description: 'Size of the draggable handle area in pixels.',
          },
          resizeSpinnerSize: {
            type: 'number',
            default: 20,
            description: 'Size of the resize indicator dots in pixels.',
          },
          colorFill: {
            type: 'string',
            description: 'Color of the splitter bar.',
          },
          colorFillTertiary: {
            type: 'string',
            description: 'Background color of the drag trigger area.',
          },
          colorFillSecondary: {
            type: 'string',
            description: 'Background color of the drag trigger area on hover.',
          },
          colorPrimary: {
            type: 'string',
            description: 'Color used for the collapse arrows.',
          },
          colorText: {
            type: 'string',
            description: 'Color of the resize dots indicator.',
          },
          colorBgElevated: {
            type: 'string',
            description: 'Background color of the drag trigger handle.',
          },
          borderRadius: {
            type: 'number',
            default: 6,
            description: 'Border radius of the drag trigger handle.',
          },
        },
      },
    },
  },
  events: {
    type: 'object',
    properties: {
      onCollapse: {
        type: 'array',
        description: 'Trigger action when a panel is collapsed or expanded.',
      },
      onResize: {
        type: 'array',
        description: 'Trigger action when panel sizes change during resize.',
      },
      onResizeEnd: {
        type: 'array',
        description: 'Trigger action when resize ends.',
      },
      onResizeStart: {
        type: 'array',
        description: 'Trigger action when resize starts.',
      },
    },
  },
  cssKeys: ['element'],
};

export default schema;
