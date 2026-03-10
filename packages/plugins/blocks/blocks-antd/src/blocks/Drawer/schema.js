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
      closable: {
        type: 'boolean',
        default: true,
        description:
          'Whether a close (x) button is visible on top right of the Drawer dialog or not.',
      },
      mask: {
        type: 'boolean',
        default: true,
        description: 'Whether to show mask or not.',
      },
      maskClosable: {
        type: 'boolean',
        default: true,
        description: 'Clicking on the mask (area outside the Drawer) to close the Drawer or not.',
      },
      title: {
        type: 'string',
        description: 'The title of the Drawer.',
      },
      width: {
        type: ['string', 'number'],
        default: '256px',
        description: 'Width of the Drawer dialog.',
        docs: {
          displayType: 'string',
        },
      },
      height: {
        type: ['string', 'number'],
        default: '256px',
        description: 'When placement is top or bottom, height of the Drawer dialog.',
        docs: {
          displayType: 'string',
        },
      },
      headerStyle: {
        type: 'object',
        description: 'Css style to applied to drawer header.',
        docs: {
          displayType: 'yaml',
        },
      },
      bodyStyle: {
        type: 'object',
        description: 'Css style to applied to drawer body.',
        docs: {
          displayType: 'yaml',
        },
      },
      contentWrapperStyle: {
        type: 'object',
        description: 'Css style to applied to content area.',
        docs: {
          displayType: 'yaml',
        },
      },
      maskStyle: {
        type: 'object',
        description: 'Css style to applied to drawer mask.',
        docs: {
          displayType: 'yaml',
        },
      },
      drawerStyle: {
        type: 'object',
        description: 'Css style to applied to drawer.',
        docs: {
          displayType: 'yaml',
        },
      },
      zIndex: {
        type: 'integer',
        default: 1000,
        description: 'The z-index of the Drawer.',
      },
      placement: {
        type: 'string',
        enum: ['top', 'right', 'bottom', 'left'],
        default: 'right',
        description: 'The placement of the Drawer.',
      },
      keyboard: {
        type: 'boolean',
        default: true,
        description: 'Whether support press esc to close.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/drawer#design-token',
        },
        properties: {
          footerPaddingBlock: {
            type: 'number',
            default: 8,
            description: 'Vertical padding of the footer.',
          },
          footerPaddingInline: {
            type: 'number',
            default: 16,
            description: 'Horizontal padding of the footer.',
          },
          zIndexPopup: {
            type: 'number',
            default: 1000,
            description: 'Z-index of the drawer.',
          },
          draggerSize: {
            type: 'number',
            default: 4,
            description: 'Size of the resize handle.',
          },
          colorBgElevated: {
            type: 'string',
            description: 'Background color of the drawer.',
          },
          colorBgMask: {
            type: 'string',
            default: 'rgba(0, 0, 0, 0.45)',
            description: 'Background color of the drawer mask.',
          },
        },
      },
    },
  },
  events: {
    type: 'object',
    additionalProperties: false,
    properties: {
      onToggle: {
        type: 'array',
        description: 'Trigger actions when drawer is toggled.',
      },
      onClose: {
        type: 'array',
        description: 'Trigger actions when drawer is closed.',
      },
      onOpen: {
        type: 'array',
        description: 'Trigger actions when drawer is opened.',
      },
      afterClose: {
        type: 'array',
        description: 'Trigger actions after drawer is closed.',
      },
      afterOpenChange: {
        type: 'array',
        description: 'Trigger actions after drawer is opened.',
      },
    },
  },
  cssKeys: ['element', 'header', 'body', 'footer', 'mask', 'wrapper', 'content'],
};

export default schema;
