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
  category: 'input',
  icons: ['AiOutlineLoading', 'AiOutlineCamera'],
  valueType: 'object',
  cssKeys: {
    element: 'The outer block wrapper around the upload card and list.',
    trigger: 'The antd upload trigger card (.ant-upload-select) — the dashed upload tile.',
    list: 'The uploaded photos list container.',
    item: 'Each uploaded photo tile in the list.',
    icon: 'The icon shown inside the upload trigger card (camera / loading).',
    title: 'The title text shown below the icon inside the upload trigger card.',
  },
  events: {
    onBeforeUpload: {
      description: 'Triggered before upload starts. If any action throws, the upload is cancelled.',
      event: { file: 'The raw File object selected by the user.' },
    },
    onChange: 'Triggered when the upload state is changing.',
    onProgress: {
      description: 'Triggered when the upload state is in progress.',
      event: { file: 'The file being uploaded.', fileList: 'The full list of files.' },
    },
    onSuccess: {
      description: 'Triggered when the upload state is done uploading.',
      event: { file: 'The uploaded file.', fileList: 'The full list of files.' },
    },
    onRemove: {
      description: 'Triggered when the upload has been removed.',
      event: { file: 'The removed file.', fileList: 'The full list of files.' },
    },
    onError: {
      description: 'Triggered when the upload has failed.',
      event: { file: 'The file that failed.', fileList: 'The full list of files.' },
    },
  },
  properties: {
    type: 'object',
    required: ['s3PostPolicyRequestId'],
    properties: {
      title: {
        type: 'string',
        description: "Title of the file input to be displayed instead of 'Upload image'.",
        default: 'Upload image',
      },
      disabled: {
        type: 'boolean',
        description: 'Disable the file input.',
      },
      maxCount: {
        type: 'number',
        description: 'Maximum number of files that can be uploaded.',
      },
      s3PostPolicyRequestId: {
        type: 'string',
        description:
          'Id of a request of type AwsS3PresignedPostPolicy that defines to which S3 bucket and how the file should be uploaded.',
        docs: {
          displayType: 'manual',
          block: {
            id: 'block_properties_s3PostPolicyRequestId',
            layout: { _global: 'settings_input_layout' },
            type: 'Label',
            required: true,
            properties: {
              title: 's3PostPolicyRequestId',
              span: 8,
              align: 'right',
            },
            blocks: [
              {
                id: 'block_properties_s3PostPolicyRequestId_text',
                type: 'Markdown',
                style: {
                  color: '#8c8c8c',
                },
                properties: {
                  content:
                    'Id of a request of type AwsS3PresignedPostPolicy that defines to which S3 bucket and how the file should be uploaded.',
                },
              },
            ],
          },
        },
      },
      showUploadList: {
        type: 'boolean',
        default: true,
        description: 'Whether to show default upload list.',
      },
      singleFile: {
        type: 'boolean',
        default: false,
        description:
          'Only allow a single file to be uploaded. Only one file can be selected in the prompt.',
      },
      theme: uploadTheme,
    },
  },
};
