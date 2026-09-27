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

const showUploadList = {
  type: ['boolean', 'object'],
  default: true,
  description:
    'Whether to show the uploaded file list. Set an object to choose which actions each file shows.',
  docs: {
    displayType: 'yaml',
  },
  additionalProperties: false,
  properties: {
    showPreviewIcon: {
      type: 'boolean',
      default: true,
      description: 'Show the preview action on picture list items.',
    },
    showRemoveIcon: {
      type: 'boolean',
      default: true,
      description: 'Show the remove action, so files can be removed from the list.',
    },
    showDownloadIcon: {
      type: 'boolean',
      default: false,
      description: 'Show the download action.',
    },
  },
};

export default showUploadList;
