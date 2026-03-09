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
      breakpoint: {
        type: 'string',
        enum: ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
        default: 'sm',
        description: 'Breakpoint of the responsive layout',
      },
      collapsedWidth: {
        type: 'integer',
        description:
          'Width of the collapsed sidebar, by setting to 0 a special trigger will appear',
      },
      collapsible: {
        type: 'boolean',
        description: 'Whether can be collapsed',
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
      theme: {
        type: 'string',
        enum: ['light', 'dark'],
        default: 'dark',
        description: 'Color theme of the sidebar',
      },
      width: {
        type: ['string', 'number'],
        description: 'width of the sidebar',
        docs: {
          displayType: 'string',
        },
      },
    },
  },
  events: {
    type: 'object',
    additionalProperties: false,
    properties: {
      onClose: {
        type: 'array',
        description: 'Trigger actions when sider is closed.',
      },
      onOpen: {
        type: 'array',
        description: 'Trigger actions when sider is opened.',
      },
      onBreakpoint: {
        type: 'array',
        description: 'Trigger actions on breakpoint change.',
      },
    },
  },
  cssKeys: ['element'],
};

export default schema;
