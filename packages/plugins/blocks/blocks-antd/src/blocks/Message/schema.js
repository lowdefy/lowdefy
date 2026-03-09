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
      content: {
        type: 'string',
        description: 'The content of the message - supports html.',
      },
      duration: {
        type: 'number',
        default: 4.5,
        description: "Time(seconds) before auto-dismiss, don't dismiss if set to 0.",
      },
      icon: {
        type: ['string', 'object'],
        description:
          "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize message icon.",
        docs: {
          displayType: 'icon',
        },
      },
      status: {
        type: 'string',
        enum: ['success', 'error', 'info', 'warning', 'loading'],
        default: 'info',
        description: 'Message status type.',
      },
      messageStyle: {
        type: 'object',
        description: 'Css style to applied to message.',
        docs: {
          displayType: 'yaml',
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
    },
  },
  events: {
    type: 'object',
    additionalProperties: false,
    properties: {
      onClose: {
        type: 'array',
        description: 'Trigger actions when message is closed.',
      },
    },
  },
  cssKeys: ['element'],
};

export default schema;
