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

import icon from '../../schemas/icon.js';

export default {
  category: 'container',
  icons: [],
  valueType: null,
  slots: false,
  cssKeys: {
    element: 'The Splitter element.',
    panel: 'Each Splitter panel.',
    dragger: 'The drag handle between panels.',
    draggerIcon: 'The custom icon in the drag handle, set with draggerIcon.',
    collapseIcon: 'The custom collapse icons, set with collapsible.icon.',
  },
  events: {
    onCollapse: {
      description: 'Trigger action when a panel is collapsed or expanded.',
      event: { collapsed: 'Whether the panel is collapsed.', sizes: 'The panel sizes array.' },
    },
    onResize: {
      description: 'Trigger action when panel sizes change during resize.',
      event: { sizes: 'The panel sizes array.' },
    },
    onResizeEnd: {
      description: 'Trigger action when resize ends.',
      event: { sizes: 'The panel sizes array.' },
    },
    onResizeStart: {
      description: 'Trigger action when resize starts.',
      event: { sizes: 'The panel sizes array.' },
    },
    onDraggerDoubleClick: {
      description: 'Trigger action when a drag handle is double-clicked.',
      event: { index: 'The index of the drag handle, counted from 0.' },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      collapsible: {
        type: 'object',
        description:
          'Collapse behaviour shared by all panels. Which panels collapse is set per panel with panels[].collapsible.',
        docs: {
          displayType: 'yaml',
        },
        additionalProperties: false,
        properties: {
          motion: {
            type: 'boolean',
            default: false,
            description: 'Animate panels as they collapse and expand.',
          },
          icon: {
            type: 'object',
            description: 'Custom collapse icons.',
            additionalProperties: false,
            properties: {
              start: {
                ...icon,
                description:
                  'Icon name or properties of an Icon block for the collapse button that moves the bar towards the start.',
              },
              end: {
                ...icon,
                description:
                  'Icon name or properties of an Icon block for the collapse button that moves the bar towards the end.',
              },
            },
          },
        },
      },
      destroyOnHidden: {
        type: 'boolean',
        default: false,
        description:
          'Unmount the blocks in a panel while it is collapsed. Can be overridden per panel.',
      },
      draggerIcon: {
        ...icon,
        description:
          'Icon name (a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`) or properties of an Icon block to show in the drag handle.',
      },
      lazy: {
        type: 'boolean',
        default: false,
        description: 'Lazy render panel content.',
      },
      layout: {
        type: 'string',
        enum: ['horizontal', 'vertical'],
        default: 'horizontal',
        description: 'Layout direction of the splitter. Prefer orientation.',
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
          'Panel configuration array. Each panel has key, size, min, max, defaultSize, collapsible, resizable and destroyOnHidden.',
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
              default: false,
              description:
                'Whether the panel is collapsible. Set an object to choose the collapse directions and when the collapse buttons show.',
              additionalProperties: false,
              properties: {
                start: {
                  type: 'boolean',
                  description: 'Show a collapse button on the bar at the start edge of the panel.',
                },
                end: {
                  type: 'boolean',
                  description: 'Show a collapse button on the bar at the end edge of the panel.',
                },
                showCollapsibleIcon: {
                  type: ['boolean', 'string'],
                  enum: [true, false, 'auto'],
                  default: 'auto',
                  description:
                    'When to show the collapse buttons: always (true), never (false) or on hover (auto).',
                },
              },
            },
            destroyOnHidden: {
              type: 'boolean',
              description:
                'Unmount the blocks in this panel while it is collapsed. Overrides the Splitter destroyOnHidden.',
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
};
