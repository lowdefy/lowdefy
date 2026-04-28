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

import uploadTheme from '../../schemas/uploadTheme.js';

export default {
  category: 'display',
  icons: [],
  valueType: null,
  cssKeys: {
    element: 'The S3Download element.',
  },
  events: {
    onChange: 'Triggered when the upload state is changing.',
    onRemove: {
      description:
        'Triggered when a file remove icon is clicked. The file is NOT removed automatically — the handler is responsible for updating `fileList` (e.g. via `SetState`).',
      event: { file: 'The file whose remove icon was clicked.' },
    },
  },
  properties: {
    type: 'object',
    required: ['s3GetPolicyRequestId'],
    properties: {
      fileList: {
        type: 'array',
        description:
          'List of files to be downloaded. If files were uploaded using an S3Upload block, the fileList value can just be mapped to this field.',
        items: {
          type: 'object',
          required: ['key'],
          properties: {
            key: {
              type: 'string',
              description: 'S3 file key.',
            },
            lastModified: {
              type: 'string',
              description: 'File last modified date.',
            },
            name: {
              type: 'string',
              description: 'File name.',
            },
            size: {
              type: 'number',
              description: 'File size in bytes.',
            },
            type: {
              type: 'string',
              description: 'File MIME type.',
            },
          },
        },
      },
      s3GetPolicyRequestId: {
        type: 'string',
        description:
          'Id of a request of type AwsS3PresignedGetObject that defines which S3 bucket and file to download.',
      },
      showRemoveIcon: {
        type: 'boolean',
        default: false,
        description:
          'Show a remove (×) icon next to each file in the list. Clicking it fires the `onRemove` event; the file is not removed from `fileList` automatically — the action handler is responsible.',
      },
      theme: uploadTheme,
    },
  },
};
