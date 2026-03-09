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
          'Id of a request of type s3GetPolicyRequestId that defines to which S3 bucket and what file should be downloaded.',
        docs: {
          displayType: 'manual',
          block: {
            id: 'block_properties_s3GetPolicyRequestId',
            layout: { _global: 'settings_input_layout' },
            type: 'Label',
            required: true,
            properties: {
              title: 's3GetPolicyRequestId',
              span: 8,
              align: 'right',
            },
            blocks: [
              {
                id: 'block_properties_s3GetPolicyRequestId_text',
                type: 'Markdown',
                style: {
                  color: '#8c8c8c',
                },
                properties: {
                  content:
                    'Id of a request of type AwsS3PresignedGetPolicy that defines to which S3 bucket and what file should be downloaded.',
                },
              },
            ],
          },
        },
      },
      style: {
        type: 'object',
        description: 'Css style object to applied to download component.',
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
    },
  },
};
