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
      centered: {
        type: 'boolean',
        default: false,
        description: 'Center the modal vertically.',
      },
      closable: {
        type: 'boolean',
        default: true,
        description:
          'Whether a close (x) button is visible on top right of the modal dialog or not.',
      },
      title: {
        type: 'string',
        description: "The modal dialog's title - supports html.",
      },
      footer: {
        type: 'boolean',
        default: true,
        description: 'Show footer area.',
      },
      mask: {
        type: 'boolean',
        default: true,
        description: 'Whether show mask or not.',
      },
      maskClosable: {
        type: 'boolean',
        default: true,
        description:
          'Whether to close the modal dialog when the mask (area outside the modal) is clicked.',
      },
      okText: {
        type: 'string',
        default: 'Ok',
        description: 'Text of the Ok button.',
      },
      okButtonProps: {
        type: 'object',
        description: 'Set additional properties for the ok button.',
        docs: {
          displayType: 'yaml',
        },
      },
      cancelText: {
        type: 'string',
        default: 'Cancel',
        description: 'Text of the Cancel button.',
      },
      cancelButtonProps: {
        type: 'object',
        description: 'Set additional properties for the cancel button.',
        docs: {
          displayType: 'yaml',
        },
      },
      width: {
        type: ['string', 'number'],
        default: '520px',
        description: 'Width of the modal dialog.',
        docs: {
          displayType: 'string',
        },
      },
      wrapperStyle: {
        type: 'object',
        description: 'Css style to applied to modal wrapper.',
        docs: {
          displayType: 'yaml',
        },
      },
      zIndex: {
        type: 'integer',
        default: 1000,
        description: 'The z-index of the modal. Useful when displaying two modals simultaneously.',
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
          headerPadding: {
            type: ['number', 'string'],
            description: 'Padding of the header area.',
          },
          headerBorderBottom: {
            type: 'string',
            description: 'Border bottom of the header.',
          },
          headerMarginBottom: {
            type: 'number',
            default: 8,
            description: 'Margin bottom of the header.',
          },
          bodyPadding: {
            type: 'number',
            description: 'Padding of the body area.',
          },
          footerPadding: {
            type: ['number', 'string'],
            description: 'Padding of the footer area.',
          },
          footerBorderTop: {
            type: 'string',
            description: 'Border top of the footer.',
          },
          footerBorderRadius: {
            type: ['number', 'string'],
            description: 'Border radius of the footer.',
          },
          footerMarginTop: {
            type: ['number', 'string'],
            default: 8,
            description: 'Margin top of the footer.',
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
  events: {
    type: 'object',
    additionalProperties: false,
    properties: {
      onOk: {
        type: 'array',
        description: 'Trigger actions when Ok button is clicked.',
      },
      onOpen: {
        type: 'array',
        description: 'Trigger actions when modal is opened.',
      },
      onCancel: {
        type: 'array',
        description: 'Trigger actions when Cancel button is clicked.',
      },
      onClose: {
        type: 'array',
        description: 'Trigger actions after onOk or onCancel is completed.',
      },
    },
  },
  cssKeys: ['element', 'header', 'body', 'footer', 'mask', 'wrapper', 'content'],
};

export default schema;
