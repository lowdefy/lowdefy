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
          getter: {},
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
      style: {
        type: 'object',
        description: 'Css style object to applied to draggable area.',
        docs: {
          displayType: 'yaml',
        },
      },
    },
  },
  events: {
    type: 'object',
    properties: {
      onChange: {
        type: 'array',
        description: 'Triggered when the upload state is changing.',
      },
      onProgress: {
        type: 'array',
        description: 'Triggered when the upload state is in progress.',
      },
      onSuccess: {
        type: 'array',
        description: 'Triggered when the upload state is done uploading.',
      },
      onRemove: {
        type: 'array',
        description: 'Triggered when the upload has been removed.',
      },
      onError: {
        type: 'array',
        description: 'Triggered when the upload has failed.',
      },
    },
  },
};
