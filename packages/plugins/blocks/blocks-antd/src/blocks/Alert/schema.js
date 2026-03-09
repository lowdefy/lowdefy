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
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      banner: {
        type: 'boolean',
        default: false,
        description: 'Style as banner at top of application window.',
      },
      closable: {
        type: 'boolean',
        default: false,
        description: 'Allow alert to be closed.',
      },
      closeText: {
        type: 'string',
        description: 'Close text to show.',
      },
      description: {
        type: 'string',
        description: 'Content description of alert - supports html.',
      },
      icon: {
        type: ['string', 'object'],
        description:
          'Name of an Ant Design Icon or properties of an Icon block to customize alert icon.',
        docs: {
          displayType: 'icon',
        },
      },
      message: {
        type: 'string',
        description: 'Content message of alert - supports html.',
      },
      showIcon: {
        type: 'boolean',
        default: true,
        description: 'Show type default icon.',
      },
      type: {
        type: 'string',
        enum: ['success', 'info', 'warning', 'error'],
        default: 'info',
        description: 'Alert style type.',
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
      onClose: {
        type: 'array',
        description: 'Called when Alert close button is clicked.',
      },
      afterClose: {
        type: 'array',
        description: 'Called after Alert has been closed.',
      },
    },
  },
  cssKeys: ['element', 'icon', 'message', 'description', 'action', 'closeIcon'],
};

export default schema;
