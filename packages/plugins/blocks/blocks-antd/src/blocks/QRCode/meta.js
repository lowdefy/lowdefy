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
    element: 'The QRCode element.',
  },
  events: {
    onRefresh: 'Trigger action when expired QR code refresh button is clicked.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      value: {
        type: 'string',
        description: 'Scanned text.',
      },
      size: {
        type: 'integer',
        default: 160,
        description: 'QRCode size in pixels.',
      },
      color: {
        type: 'string',
        default: '#000000',
        description: 'QRCode color.',
      },
      bgColor: {
        type: 'string',
        default: 'transparent',
        description: 'QRCode background color.',
      },
      errorLevel: {
        type: 'string',
        enum: ['L', 'M', 'Q', 'H'],
        default: 'M',
        description: 'Error correction level.',
      },
      icon: {
        type: 'string',
        description: 'Icon URL in the center of the QR code.',
      },
      iconSize: {
        type: 'integer',
        default: 40,
        description: 'Icon size in pixels.',
      },
      marginSize: {
        type: 'number',
        default: 0,
        description: 'Margin size of the QR code in modules.',
      },
      minVersion: {
        type: 'integer',
        minimum: 1,
        maximum: 40,
        default: 1,
        description: 'Minimum QR code version (1-40). Higher versions support more data.',
      },
      type: {
        type: 'string',
        enum: ['canvas', 'svg'],
        default: 'canvas',
        description: 'Render type.',
      },
      bordered: {
        type: 'boolean',
        default: true,
        description: 'Whether has border style.',
      },
      status: {
        type: 'string',
        enum: ['active', 'expired', 'loading', 'scanned'],
        default: 'active',
        description: 'QRCode status.',
      },
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/overview#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/qr-code#design-token',
        },
        properties: {
          QRCodeTextColor: {
            type: 'string',
            description: 'Text color displayed on the QR code overlay.',
          },
          QRCodeCoverBackgroundColor: {
            type: 'string',
            description:
              'Background color of the cover overlay shown when expired, loading, or scanned.',
          },
          borderRadiusLG: {
            type: 'number',
            default: 8,
            description: 'Border radius of the QR code container.',
          },
          colorText: {
            type: 'string',
            description: 'Text color.',
          },
          colorBgContainer: {
            type: 'string',
            description: 'Background color of the QR code container.',
          },
          colorSplit: {
            type: 'string',
            description: 'Border color when bordered is true.',
          },
          lineWidth: {
            type: 'number',
            default: 1,
            description: 'Border width.',
          },
          padding: {
            type: 'number',
            default: 12,
            description: 'Padding inside the QR code container.',
          },
        },
      },
    },
  },
};
