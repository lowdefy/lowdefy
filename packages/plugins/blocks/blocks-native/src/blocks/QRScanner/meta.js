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

// The native QRScanner keeps the web block's name and onScan event (blocks-qr). It draws the
// camera of a shell that carries it (profile field) through the device registry.
export default {
  category: 'display',
  icons: [],
  valueType: null,
  cssKeys: {
    element: 'The camera view.',
  },
  events: {
    onScan: {
      description: 'Trigger actions when a code is read.',
      event: { data: 'The text the code holds.', type: 'The code type, like qr or ean13.' },
    },
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      continuous: {
        type: 'boolean',
        default: false,
        description:
          'Keep scanning after a read: each code fires onScan once, and again after 2 seconds. Otherwise the scanner stops after its first read until its reset method is called.',
      },
      height: { type: 'number', default: 300, description: 'The height of the camera view.' },
      prompt: { type: 'string', description: 'Text shown over the camera.' },
      torch: { type: 'boolean', default: false, description: 'Turn the torch on.' },
      types: {
        type: 'array',
        items: {
          type: 'string',
          enum: [
            'qr',
            'ean13',
            'ean8',
            'code128',
            'code39',
            'code93',
            'upc_a',
            'upc_e',
            'pdf417',
            'datamatrix',
            'aztec',
            'itf14',
            'codabar',
          ],
        },
        description: 'Code types to read; all by default.',
      },
    },
  },
};
