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
  category: 'container',
  icons: ['chevron-left', 'chevron-right', 'menu'],
  valueType: null,
  slots: {
    content: 'Child blocks in the sider panel.',
  },
  cssKeys: {
    element: 'The Sider element.',
    body: 'The box inside the Sider that holds its child blocks.',
  },
  events: {
    onClose: 'Trigger actions when sider is closed.',
    onOpen: 'Trigger actions when sider is opened.',
    onBreakpoint: {
      description:
        'Trigger actions when the screen width crosses the breakpoint. Use it with the setOpen method to collapse the sider on small screens.',
      event: { broken: 'Whether the screen is narrower than the breakpoint.' },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      breakpoint: {
        type: 'string',
        enum: ['xs', 'sm', 'md', 'lg', 'xl', 'xxl', 'xxxl'],
        description: 'Breakpoint of the responsive layout. Crossing it fires onBreakpoint.',
      },
      collapsedWidth: {
        type: 'integer',
        description:
          'Width of the collapsed sidebar, by setting to 0 a special trigger will appear',
      },
      collapsible: {
        type: 'boolean',
        default: false,
        description: 'Show a trigger at the bottom of the sider that collapses and expands it.',
      },
      initialCollapsed: {
        type: 'boolean',
        default: true,
        description: 'Set the initial collapsed state',
      },
      reverseArrow: {
        type: 'boolean',
        default: false,
        description: 'Direction of arrow, for a sider that expands from the right',
      },
      width: {
        type: ['string', 'number'],
        description: 'width of the sidebar',
        docs: {
          displayType: 'string',
        },
      },
      theme: {
        type: ['string', 'object'],
        description:
          'The Sider color theme, light or dark, or antd Layout design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/layout#design-token',
        },
        properties: {
          triggerHeight: {
            type: 'number',
            default: 48,
            description: 'Height of the collapse trigger of a collapsible Sider.',
          },
          triggerBg: {
            type: 'string',
            default: '#002140',
            description: 'Background color of the collapse trigger of a dark Sider.',
          },
          triggerColor: {
            type: 'string',
            default: '#fff',
            description: 'Color of the collapse trigger of a dark Sider.',
          },
          lightTriggerBg: {
            type: 'string',
            default: '#ffffff',
            description: 'Background color of the collapse trigger of a light Sider.',
          },
          lightTriggerColor: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.88)',
            description: 'Color of the collapse trigger of a light Sider.',
          },
          zeroTriggerWidth: {
            type: 'number',
            default: 40,
            description: 'Width of the trigger shown when collapsedWidth is 0.',
          },
          zeroTriggerHeight: {
            type: 'number',
            default: 40,
            description: 'Height of the trigger shown when collapsedWidth is 0.',
          },
        },
      },
    },
  },
};
