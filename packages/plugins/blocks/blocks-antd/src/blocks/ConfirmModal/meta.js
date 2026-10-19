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

import focusable from '../../schemas/focusable.js';
import icon from '../../schemas/icon.js';
import mask from '../../schemas/mask.js';

const buttonProperties = {
  type: 'object',
  docs: {
    displayType: 'button',
  },
  properties: {
    type: {
      type: 'string',
      enum: ['default', 'primary', 'dashed', 'text', 'link'],
      description: 'The button type.',
    },
    danger: {
      type: 'boolean',
      default: false,
      description: 'Set the danger status of the button.',
    },
    disabled: {
      type: 'boolean',
      default: false,
      description: 'Disable the button.',
    },
    icon: {
      ...icon,
      description:
        'Icon name (a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`) or properties of an Icon block to show in the button.',
    },
    iconPlacement: {
      type: 'string',
      enum: ['start', 'end'],
      default: 'start',
      description: 'Place the icon before (`start`) or after (`end`) the button text.',
    },
  },
};

export default {
  category: 'container',
  icons: ['success', 'info', 'warning', 'error', 'close', 'loading'],
  valueType: null,
  slots: {
    content: 'Content blocks in the confirm modal body.',
  },
  cssKeys: {
    element: 'The ConfirmModal element.',
    body: 'The ConfirmModal body.',
    cancelIcon: 'The cancel button icon in the ConfirmModal.',
    icon: 'The icon in the ConfirmModal.',
    okIcon: 'The ok button icon in the ConfirmModal.',
  },
  events: {
    onOk: 'Trigger actions when Ok button is clicked.',
    onOpen: 'Trigger actions when confirm modal is opened.',
    onCancel: 'Trigger actions when Cancel button is clicked.',
    onClose:
      'Trigger actions after the confirm modal has closed, once the onOk or onCancel actions are completed.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: {
        type: 'string',
        description: 'Modal title - supports html.',
      },
      centered: {
        type: 'boolean',
        default: false,
        description: 'Centered Modal.',
      },
      closable: {
        type: ['boolean', 'object'],
        default: false,
        description:
          'Whether a close (x) button is visible on top right of the confirm dialog or not. Set `{ disabled: true }` to show the button disabled.',
        docs: {
          displayType: 'yaml',
        },
        additionalProperties: false,
        properties: {
          disabled: {
            type: 'boolean',
            default: false,
            description: 'Show the close button, but disabled.',
          },
        },
      },
      content: {
        type: 'string',
        description: 'Modal content. Overridden by the "content" content area - supports html.',
      },
      icon: {
        ...icon,
        description:
          'Icon name (a semantic name like `edit`, a Lucide icon name like `Pencil`, or a set-qualified name like `tabler:Pencil`) or properties of an Icon block to customize modal icon.',
      },
      focusable: {
        ...focusable,
        properties: {
          ...focusable.properties,
          autoFocusButton: {
            type: ['string', 'null'],
            enum: ['ok', 'cancel', null],
            default: 'ok',
            description:
              'The button that receives focus when the confirm modal opens. Set to null to focus neither.',
          },
        },
      },
      keyboard: {
        type: 'boolean',
        default: true,
        description: 'Whether pressing Esc closes the confirm modal.',
      },
      mask,
      maskClosable: {
        type: 'boolean',
        default: false,
        description:
          'Whether to close the modal dialog when the mask (area outside the modal) is clicked. `mask.closable` takes precedence.',
      },
      scrollLock: {
        type: 'boolean',
        default: true,
        description: 'Whether to lock page scrolling while the confirm modal is open.',
      },
      okText: {
        type: 'string',
        description:
          'Text of the Ok button. When unset, antd uses the localized default from ConfigProvider locale.',
      },
      cancelText: {
        type: 'string',
        description:
          'Text of the Cancel button. When unset, antd uses the localized default from ConfigProvider locale.',
      },
      okButton: {
        ...buttonProperties,
        description: 'Ok button properties.',
      },
      cancelButton: {
        ...buttonProperties,
        description: 'Cancel button properties.',
      },
      width: {
        type: ['number', 'string'],
        default: 416,
        description: 'Width of the modal dialog.',
        docs: {
          displayType: 'string',
        },
      },
      zIndex: {
        type: 'number',
        default: 1000,
        description: 'The z-index of the Modal.',
      },
      status: {
        type: 'string',
        enum: ['success', 'error', 'info', 'warning', 'confirm'],
        default: 'confirm',
        description: 'Modal status type.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/modal#design-token',
        },
        properties: {
          headerBg: {
            type: 'string',
            description: 'Background color of the modal header.',
          },
          titleLineHeight: {
            type: 'number',
            default: 1.5,
            description: 'Line height of the modal title.',
          },
          titleFontSize: {
            type: 'number',
            default: 16,
            description: 'Font size of the modal title.',
          },
          titleColor: {
            type: 'string',
            description: 'Color of the modal title text.',
          },
          contentBg: {
            type: 'string',
            description: 'Background color of the modal content.',
          },
          footerBg: {
            type: 'string',
            default: 'transparent',
            description: 'Background color of the modal footer.',
          },
          contentPadding: {
            type: ['number', 'string'],
            description: 'Padding of the content area.',
          },
          confirmBodyPadding: {
            type: ['number', 'string'],
            description: 'Padding of the confirm modal body.',
          },
          confirmIconMarginInlineEnd: {
            type: ['number', 'string'],
            description: 'Inline end margin of the confirm modal icon.',
          },
          confirmBtnsMarginTop: {
            type: ['number', 'string'],
            description: 'Margin top of the confirm modal buttons.',
          },
          borderRadiusLG: {
            type: 'number',
            default: 8,
            description: 'Border radius of the modal.',
          },
          colorBgMask: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.45)',
            description: 'Background color of the modal mask.',
          },
        },
      },
    },
  },
};
