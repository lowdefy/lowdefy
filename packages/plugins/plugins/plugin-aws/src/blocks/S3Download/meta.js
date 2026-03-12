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
    element: 'The S3Download element.',
  },
  events: {
    onChange: 'Triggered when the upload state is changing.',
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
      theme: {
        type: 'object',
        description:
          'Antd design token overrides for this block. See <a href="https://ant.design/components/upload#design-token">antd design tokens</a>.',
        docs: {
          displayType: 'yaml',
          link: 'https://ant.design/components/upload#design-token',
        },
        properties: {
          actionsColor: {
            type: 'string',
            description: 'Color of action icons (download, preview).',
          },
          pictureCardSize: {
            type: 'number',
            description:
              'Size of list items in card type (affects both picture-card and picture-circle).',
          },
          controlItemBgHover: {
            type: 'string',
            description: 'Background color of file item on hover.',
          },
          colorIcon: {
            type: 'string',
            description: 'Color of file icons.',
          },
          fontSize: {
            type: 'number',
            description: 'Font size of file name text.',
          },
          borderRadiusSM: {
            type: 'number',
            description: 'Border radius of file list items.',
          },
        },
      },
    },
  },
};
