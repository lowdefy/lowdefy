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
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Connection Schema - FileSystem',
  type: 'object',
  required: ['basePath'],
  properties: {
    basePath: {
      type: 'string',
      description: 'Base directory path. All file operations are scoped to this directory.',
      errorMessage: {
        type: 'FileSystem connection property "basePath" should be a string.',
      },
    },
    read: {
      type: 'boolean',
      default: true,
      description: 'Allow reads from the file system.',
      errorMessage: {
        type: 'FileSystem connection property "read" should be a boolean.',
      },
    },
  },
  errorMessage: {
    type: 'FileSystem connection properties should be an object.',
    required: {
      basePath: 'FileSystem connection should have required property "basePath".',
    },
  },
};
