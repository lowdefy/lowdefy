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
  category: 'display',
  icons: [],
  valueType: null,
  cssKeys: {
    element: 'The Notification element.',
    closeIcon: 'The close icon in the Notification.',
    icon: 'The icon in the Notification.',
  },
  events: {
    onClose: 'Trigger actions when notification is closed.',
    onClick: 'Trigger actions when notification is clicked.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      bottom: {
        type: 'number',
        default: 24,
        description:
          'Distance from the bottom of the viewport, when placement is bottomRight or bottomLeft (unit: pixels).',
      },
      button: {
        type: 'object',
        description:
          'Button object to customized the close button. Triggers onClose event when clicked.',
        docs: {
          displayType: 'button',
        },
      },
      description: {
        type: 'string',
        description: 'The content of notification box - supports html.',
      },
      duration: {
        type: 'number',
        default: 4.5,
        description:
          'Time in seconds before Notification is closed. When set to 0 or null, it will never be closed automatically.',
      },
      icon: {
        type: ['string', 'object'],
        description:
          "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize notification icon.",
        docs: {
          displayType: 'icon',
        },
      },
      closeIcon: {
        type: ['string', 'object'],
        description:
          "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize close icon.",
        docs: {
          displayType: 'icon',
        },
      },
      title: {
        type: 'string',
        description: 'The title of notification box - supports html.',
      },
      notificationStyle: {
        type: 'object',
        description: 'Css style to applied to notification.',
        docs: {
          displayType: 'yaml',
        },
      },
      placement: {
        type: 'string',
        enum: ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'],
        default: 'topRight',
        description: 'Position of Notification.',
      },
      top: {
        type: 'number',
        default: 24,
        description:
          'Distance from the top of the viewport, when placement is topRight or topLeft (unit: pixels).',
      },
      status: {
        type: 'string',
        enum: ['success', 'error', 'info', 'warning'],
        description: 'Notification status type.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/notification#design-token',
        },
        properties: {
          zIndexPopup: {
            type: 'number',
            default: 1100,
            description: 'Z-index of the notification popup.',
          },
          width: {
            type: 'number',
            default: 384,
            description: 'Width of the notification box.',
          },
          progressBg: {
            type: 'string',
            description:
              'Background gradient for the auto-close progress bar. Defaults to a gradient from colorPrimaryBorderHover to colorPrimary.',
          },
        },
      },
    },
  },
};
