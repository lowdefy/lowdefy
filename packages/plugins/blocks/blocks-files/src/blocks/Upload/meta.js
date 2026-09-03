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
  icons: ['AiOutlineUpload'],
  valueType: 'object',
  cssKeys: {
    element: 'The outer block wrapper around the upload button and list.',
    trigger: 'The antd upload trigger (.ant-upload-select) that wraps the button.',
    list: 'The uploaded file list container.',
    item: 'Each uploaded file row in the list.',
  },
  events: {
    onBeforeUpload: {
      description:
        'Triggered before a file is uploaded. If an action throws, the upload is cancelled.',
      payload: {
        type: 'object',
        additionalProperties: false,
        properties: {
          file: {
            type: 'object',
            description: 'The file metadata (name, type, size, lastModified, uid, url).',
          },
        },
      },
    },
    onChange: {
      description:
        'Triggered when the upload state is changing. With emitFileContent, triggered once the file content has been read, where file includes the base64 content.',
      payload: {
        type: 'object',
        additionalProperties: false,
        properties: {
          file: { type: 'object', description: 'The file whose state changed.' },
          fileList: {
            type: 'array',
            items: { type: 'object' },
            description: 'The full list of files.',
          },
        },
      },
    },
    onProgress: {
      description: 'Triggered when the upload state is in progress.',
      payload: {
        type: 'object',
        additionalProperties: false,
        properties: {
          file: { type: 'object', description: 'The file being uploaded.' },
          fileList: {
            type: 'array',
            items: { type: 'object' },
            description: 'The full list of files.',
          },
        },
      },
    },
    onSuccess: {
      description: 'Triggered when the upload state is done uploading.',
      payload: {
        type: 'object',
        additionalProperties: false,
        properties: {
          file: { type: 'object', description: 'The uploaded file.' },
          fileList: {
            type: 'array',
            items: { type: 'object' },
            description: 'The full list of files.',
          },
        },
      },
    },
    onRemove: {
      description: 'Triggered when the upload has been removed.',
      payload: {
        type: 'object',
        additionalProperties: false,
        properties: {
          file: { type: 'object', description: 'The removed file.' },
          fileList: {
            type: 'array',
            items: { type: 'object' },
            description: 'The full list of files.',
          },
        },
      },
    },
    onError: {
      description: 'Triggered when the upload has failed.',
      payload: {
        type: 'object',
        additionalProperties: false,
        properties: {
          file: { type: 'object', description: 'The file that failed.' },
          fileList: {
            type: 'array',
            items: { type: 'object' },
            description: 'The full list of files.',
          },
        },
      },
    },
    onClick: 'Triggered when the upload button is clicked.',
  },
  properties: {
    type: 'object',
    properties: {
      accept: {
        type: 'string',
        description:
          'File types accepted by the input. See html file type input accept property at https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#accept.',
      },
      button: {
        type: 'object',
        description:
          'Button block properties. See <a href="/Button">Button</a> for all properties.',
        default: {
          icon: 'UploadOutlined',
          title: 'Upload',
          type: 'default',
        },
        docs: {
          displayType: 'button',
        },
        properties: {
          title: {
            type: 'string',
            description: 'Button title text.',
          },
          icon: {
            type: ['string', 'object'],
            description: 'Button icon name or Icon block properties.',
            docs: {
              displayType: 'icon',
            },
          },
          type: {
            type: 'string',
            enum: ['default', 'primary', 'dashed', 'text', 'link'],
            default: 'default',
            description: 'Button type.',
          },
          danger: {
            type: 'boolean',
            default: false,
            description: 'Set button style to danger.',
          },
          disabled: {
            type: 'boolean',
            default: false,
            description: 'Disable the button.',
          },
          size: {
            type: 'string',
            enum: ['small', 'default', 'large'],
            default: 'default',
            description: 'Button size.',
          },
        },
      },
      disabled: {
        type: 'boolean',
        description: 'Disable the file input.',
      },
      emitFileContent: {
        type: 'boolean',
        default: false,
        description:
          'Instead of uploading, read the file and emit { name, size, type, content } — content a base64 string — as the block value and onChange event. Use with a CallAPI action to store the file with a server-side write request (e.g. AwsS3PutObject). Replaces uploadPolicyRequestId.',
      },
      maxCount: {
        type: 'number',
        description: 'Maximum number of files that can be uploaded.',
      },
      uploadPolicyRequestId: {
        type: 'string',
        description:
          'Id of an upload-policy request (e.g. AwsS3PresignedPostPolicy, GcsSignedPostPolicy, AzureBlobUploadSas) that defines to which storage bucket and how the file should be uploaded. Required unless emitFileContent is true.',
        docs: {
          displayType: 'manual',
          block: {
            id: 'block_properties_uploadPolicyRequestId',
            layout: { _global: 'settings_input_layout' },
            type: 'Label',
            required: true,
            properties: {
              title: 'uploadPolicyRequestId',
              span: 8,
              align: 'right',
            },
            blocks: [
              {
                id: 'block_properties_uploadPolicyRequestId_text',
                type: 'Markdown',
                style: {
                  color: '#8c8c8c',
                },
                properties: {
                  content:
                    'Id of an upload-policy request that defines to which storage bucket and how the file should be uploaded.',
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
