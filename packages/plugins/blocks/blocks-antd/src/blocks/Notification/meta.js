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
  category: 'display',
  icons: ['success', 'info', 'warning', 'error', 'close', 'loading'],
  valueType: null,
  cssKeys: {
    element: 'The Notification element.',
    title: 'The Notification title.',
    description: 'The Notification description.',
    actions: 'The area holding the Notification button.',
    progress: 'The auto-close progress bar, shown with showProgress.',
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
          'Has no effect: notifications open in the app-wide notification holder, which keeps them 24px from the bottom of the viewport. To move every bottom notification, set the `--notification-bottom` CSS variable on `.ant-notification` in `public/styles.css`, for example `.ant-notification { --notification-bottom: 80px; }`.',
      },
      closable: {
        type: 'boolean',
        default: true,
        description: 'Whether to show the close button.',
      },
      button: {
        type: 'object',
        description:
          'Button object to customize the close button. Closes the notification and triggers the onClose event when clicked.',
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
        ...icon,
        description:
          'Icon name (a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`) or properties of an Icon block to customize notification icon.',
      },
      closeIcon: {
        ...icon,
        description:
          'Icon name (a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`) or properties of an Icon block to customize close icon.',
      },
      title: {
        type: 'string',
        description: 'The title of notification box - supports html.',
      },
      pauseOnHover: {
        type: 'boolean',
        default: true,
        description: 'Pause the auto-close timer while the mouse is over the notification.',
      },
      placement: {
        type: 'string',
        enum: ['top', 'topLeft', 'topRight', 'bottom', 'bottomLeft', 'bottomRight'],
        default: 'topRight',
        description: 'Position of Notification.',
      },
      role: {
        type: 'string',
        enum: ['alert', 'status'],
        default: 'alert',
        description:
          'How screen readers announce the notification. `alert` interrupts the reader immediately, `status` waits until it is idle.',
      },
      showProgress: {
        type: 'boolean',
        default: false,
        description: 'Show a progress bar counting down to when the notification closes.',
      },
      top: {
        type: 'number',
        default: 24,
        description:
          'Has no effect: notifications open in the app-wide notification holder, which keeps them 24px from the top of the viewport. To move every top notification, set the `--notification-top` CSS variable on `.ant-notification` in `public/styles.css`, for example `.ant-notification { --notification-top: 80px; }`.',
      },
      status: {
        type: 'string',
        enum: ['success', 'error', 'info', 'warning'],
        default: 'success',
        description: 'Notification status type.',
      },
      theme: {
        type: 'object',
        description:
          'Has no effect: notifications render in the app-wide notification holder, outside the block. Set these Notification design tokens for the whole app in `lowdefy.yaml` under `theme.antd.components.Notification`.',
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
