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
  icons: [],
  valueType: null,
  cssKeys: {
    element: 'The ConfirmModal element.',
    body: 'The ConfirmModal body.',
  },
  events: {
    onOk: 'Trigger actions when Ok button is clicked.',
    onOpen: 'Trigger actions when confirm modal is opened.',
    onCancel: 'Trigger actions when Cancel button is clicked.',
    onClose: 'Triggered after onOk or onCancel actions are completed.',
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
        type: 'boolean',
        default: false,
        description:
          'Whether a close (x) button is visible on top right of the confirm dialog or not.',
      },
      content: {
        type: 'string',
        description: 'Modal content. Overridden by the "content" content area - supports html.',
      },
      icon: {
        type: ['string', 'object'],
        description:
          "Name of an React-Icon (See <a href='https://react-icons.github.io/react-icons/'>all icons</a>) or properties of an Icon block to customize modal icon.",
        docs: {
          displayType: 'icon',
        },
      },
      mask: {
        type: 'boolean',
        default: true,
        description: 'Whether show mask or not.',
      },
      maskClosable: {
        type: 'boolean',
        default: false,
        description:
          'Whether to close the modal dialog when the mask (area outside the modal) is clicked.',
      },
      modalStyle: {
        type: 'object',
        description: 'Css style to applied to modal.',
        docs: {
          displayType: 'yaml',
        },
      },
      okText: {
        type: 'string',
        default: 'Ok',
        description: 'Text of the Ok button.',
      },
      cancelText: {
        type: 'string',
        default: 'Cancel',
        description: 'Text of the Cancel button.',
      },
      okButton: {
        type: 'object',
        description: 'Ok button properties.',
        docs: {
          displayType: 'button',
        },
      },
      cancelButton: {
        type: 'object',
        description: 'Cancel button properties.',
        docs: {
          displayType: 'button',
        },
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
