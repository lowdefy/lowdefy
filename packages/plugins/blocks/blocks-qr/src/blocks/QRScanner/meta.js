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

// The web QRScanner takes the native QRScanner's (blocks-native) types, continuous, torch and
// onScan { data, type }, so one page config reads codes on web and mobile.
export default {
  category: 'input',
  icons: [],
  valueType: 'object',
  cssKeys: {
    element: 'The QRScanner element.',
  },
  events: {
    onScan: {
      description:
        'Trigger actions when a code is read. The block value is set to the same object.',
      event: { data: 'The text the code holds.', type: 'The code type, like qr or ean13.' },
    },
    onError: {
      description:
        'Trigger actions when the camera cannot start or the scanner stops reading, for example when camera permission is denied.',
      event: {
        error:
          'The error as { name, message }. name is the browser error name: NotAllowedError (permission denied), NotFoundError (no camera), NotReadableError (camera in use), OverconstrainedError (no camera matches deviceId), SecurityError (page not served over https) or CameraEndedError (the camera stopped while scanning: unplugged, taken by another app, or the phone locked). Other errors, like a code reader that failed to load, carry their own name and message.',
      },
    },
  },
  methods: {
    start: 'Open the camera and start reading codes. A single-scan scanner reads again.',
    stop: 'Stop reading codes and release the camera.',
    reset:
      'Read again after a single-scan scanner has kept its first code, without restarting the camera.',
  },
  properties: {
    type: 'object',
    additionalProperties: false,
    properties: {
      types: {
        type: 'array',
        minItems: 1,
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
            'databar',
            'databar_expanded',
            'maxicode',
          ],
        },
        description:
          'Code types to read. By default, every type the browser reads; databar, databar_expanded and maxicode (web only) are read only when listed. Asking only for the types you need makes reading faster.',
      },
      continuous: {
        type: 'boolean',
        default: false,
        description:
          'Keep scanning after a read: each code fires onScan once, and again after 2 seconds. Otherwise the scanner stops after its first read until its reset method is called.',
      },
      inactiveByDefault: {
        type: 'boolean',
        default: false,
        description: 'Do not open the camera when the block mounts; call the start method instead.',
      },
      facingMode: {
        type: 'string',
        enum: ['environment', 'user'],
        default: 'environment',
        description: 'The camera to use: environment (back) or user (front).',
      },
      deviceId: {
        type: 'string',
        description: 'The id of a specific camera to use, instead of facingMode.',
      },
      fps: {
        type: 'number',
        exclusiveMinimum: 0,
        default: 10,
        description: 'Camera frames read per second.',
      },
      qrbox: {
        type: ['number', 'object'],
        description:
          'The scan area in pixels, drawn over the camera and centred: a number for a square, or { width, height }. Only codes inside it are read. If not set, the whole frame is read.',
      },
      height: {
        type: 'number',
        description:
          'The height of the camera view in pixels. The video fills the width and is centred, cropped at the top and bottom if it is taller. By default, the height of the video.',
      },
      prompt: {
        type: 'string',
        description: 'Text shown over the bottom of the camera, like "Point the camera at a code".',
      },
      aspectRatio: {
        type: 'number',
        default: 1,
        description: 'The aspect ratio asked of the camera.',
      },
      torch: {
        type: 'boolean',
        default: false,
        description:
          'Turn the torch on, where the camera has one (most Android back cameras; not iPhones in Safari).',
      },
    },
  },
};
