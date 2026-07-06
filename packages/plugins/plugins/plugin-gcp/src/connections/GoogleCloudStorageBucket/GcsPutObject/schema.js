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
  title: 'Lowdefy Request Schema - GcsPutObject',
  type: 'object',
  required: ['key', 'content'],
  properties: {
    content: {
      type: 'string',
      description: 'Object content as a base64 encoded string.',
      errorMessage: {
        type: 'GcsPutObject request property "content" should be a string.',
      },
    },
    contentType: {
      type: 'string',
      description: 'MIME type of the object (sets the Content-Type of the stored object).',
      errorMessage: {
        type: 'GcsPutObject request property "contentType" should be a string.',
      },
    },
    key: {
      type: 'string',
      description: 'Key under which the object will be stored.',
      errorMessage: {
        type: 'GcsPutObject request property "key" should be a string.',
      },
    },
    public: {
      type: 'boolean',
      default: false,
      description: 'Make the stored object publicly readable.',
      errorMessage: {
        type: 'GcsPutObject request property "public" should be a boolean.',
      },
    },
  },
  errorMessage: {
    type: 'GcsPutObject request properties should be an object.',
    required: {
      key: 'GcsPutObject request should have required property "key".',
      content: 'GcsPutObject request should have required property "content".',
    },
  },
};
