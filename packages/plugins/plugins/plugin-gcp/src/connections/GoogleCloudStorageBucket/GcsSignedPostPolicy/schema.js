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
  title: 'Lowdefy Request Schema - GcsSignedPostPolicy',
  type: 'object',
  required: ['key'],
  properties: {
    conditions: {
      type: 'array',
      items: {
        type: 'array',
      },
      description: 'Conditions to be enforced on the request.',
      errorMessage: {
        type: 'GcsSignedPostPolicy request property "conditions" should be a array.',
      },
    },
    expires: {
      type: 'number',
      description: 'Number of seconds for which the policy should be valid.',
      default: 3600,
      errorMessage: {
        type: 'GcsSignedPostPolicy request property "expires" should be a number.',
      },
    },
    fields: {
      type: 'object',
      description: 'Additional form fields to include in the POST policy (e.g. acl).',
      errorMessage: {
        type: 'GcsSignedPostPolicy request property "fields" should be an object.',
      },
    },
    key: {
      type: 'string',
      description: 'Key under which object will be stored.',
      errorMessage: {
        type: 'GcsSignedPostPolicy request property "key" should be a string.',
      },
    },
  },
  errorMessage: {
    type: 'GcsSignedPostPolicy request properties should be an object.',
    required: 'GcsSignedPostPolicy request should have required property "key".',
  },
};
