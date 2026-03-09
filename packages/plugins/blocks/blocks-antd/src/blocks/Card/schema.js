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
      bordered: {
        type: 'boolean',
        default: true,
        description: 'Toggles rendering of the border around the card.',
      },
      hoverable: {
        type: 'boolean',
        default: false,
        description: 'Lift up when hovering card.',
      },
      headerStyle: {
        type: 'object',
        description: 'Css style to applied to card header.',
        docs: {
          displayType: 'yaml',
        },
      },
      bodyStyle: {
        type: 'object',
        description: 'Css style to applied to card body.',
        docs: {
          displayType: 'yaml',
        },
      },
      inner: {
        type: 'boolean',
        default: false,
        description: 'Change the card style to inner.',
      },
      size: {
        type: 'string',
        enum: ['default', 'small'],
        default: 'default',
        description: 'Size of the card.',
      },
      title: {
        type: 'string',
        description:
          'Title to show in the title area - supports html. Overwritten by blocks in the title content area.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
        },
      },
    },
  },
  events: {
    type: 'object',
    additionalProperties: false,
    properties: {
      onClick: {
        type: 'array',
        description: 'Trigger actions when the Card is clicked.',
      },
    },
  },
  cssKeys: ['element', 'header', 'body', 'cover', 'actions', 'extra'],
};

export default schema;
