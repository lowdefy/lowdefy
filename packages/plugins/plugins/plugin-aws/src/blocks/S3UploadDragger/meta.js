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
  category: 'input',
  icons: [],
  valueType: 'object',
  cssKeys: {
    element: 'The upload dragger area.',
    hint: 'The hint text inside the dragger.',
  },
  events: {
    onChange: 'Triggered when the upload state is changing.',
    onProgress: 'Triggered when the upload state is in progress.',
    onSuccess: 'Triggered when the upload state is done uploading.',
    onRemove: 'Triggered when the upload has been removed.',
    onError: 'Triggered when the upload has failed.',
  },
  properties: {
    type: 'object',
    required: ['s3PostPolicyRequestId'],
    properties: {
      title: {
        type: 'string',
        description: 'Title of the file input to be displayed on the draggable area.',
      },
      accept: {
        type: 'string',
        description:
          'File types accepted by the input. See html file type input accept property at https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input/file#accept.',
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
    },
  },
};
