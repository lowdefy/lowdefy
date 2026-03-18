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
  slots: ['action'],
  cssKeys: {
    element: 'The Alert element.',
    icon: 'The icon in the Alert.',
    message: 'The Alert message.',
    description: 'The Alert description.',
    action: 'The Alert action.',
    closeIcon: 'The Alert close icon.',
  },
  events: {
    onClose: 'Called when Alert close button is clicked.',
    afterClose: 'Called after Alert has been closed.',
  },
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
          link: 'https://ant.design/components/alert#design-token',
        },
        properties: {
          defaultPadding: {
            type: 'string',
            default: '8px 12px',
            description: 'Default padding for the alert without description.',
          },
          withDescriptionPadding: {
            type: 'string',
            default: '20px 24px',
            description: 'Padding for the alert when a description is present.',
          },
          withDescriptionIconSize: {
            type: 'number',
            default: 24,
            description: 'Icon size when the alert has a description.',
          },
          colorText: {
            type: 'string',
            description: 'Text color of the alert message.',
          },
          colorTextHeading: {
            type: 'string',
            description: 'Heading text color when the alert has a description.',
          },
          colorIcon: {
            type: 'string',
            description: 'Icon color override.',
          },
          colorIconHover: {
            type: 'string',
            description: 'Icon hover color for the close button.',
          },
          fontSize: {
            type: 'number',
            default: 14,
            description: 'Font size of the alert text.',
          },
          fontSizeLG: {
            type: 'number',
            default: 16,
            description: 'Font size of the alert message when a description is present.',
          },
          lineHeight: {
            type: 'number',
            default: 1.5714,
            description: 'Line height of the alert text.',
          },
          borderRadius: {
            type: 'number',
            default: 8,
            description: 'Border radius of the alert container.',
          },
          borderRadiusLG: {
            type: 'number',
            default: 8,
            description: 'Border radius for large alerts.',
          },
          colorSuccessBg: {
            type: 'string',
            description: 'Background color for success alerts.',
          },
          colorSuccessBorder: {
            type: 'string',
            description: 'Border color for success alerts.',
          },
          colorInfoBg: {
            type: 'string',
            description: 'Background color for info alerts.',
          },
          colorInfoBorder: {
            type: 'string',
            description: 'Border color for info alerts.',
          },
          colorWarningBg: {
            type: 'string',
            description: 'Background color for warning alerts.',
          },
          colorWarningBorder: {
            type: 'string',
            description: 'Border color for warning alerts.',
          },
          colorErrorBg: {
            type: 'string',
            description: 'Background color for error alerts.',
          },
          colorErrorBorder: {
            type: 'string',
            description: 'Border color for error alerts.',
          },
        },
      },
    },
  },
};
