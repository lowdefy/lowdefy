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
  type: 'object',
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
    },
  },
};
