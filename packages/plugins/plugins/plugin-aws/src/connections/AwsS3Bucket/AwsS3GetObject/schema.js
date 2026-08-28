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
  title: 'Lowdefy Request Schema - AwsS3GetObject',
  type: 'object',
  required: ['key'],
  properties: {
    key: {
      type: 'string',
      description: 'Key under which the object is stored.',
      errorMessage: {
        type: 'AwsS3GetObject request property "key" should be a string.',
      },
    },
    versionId: {
      type: 'string',
      description: 'VersionId used to reference a specific version of the object.',
      errorMessage: {
        type: 'AwsS3GetObject request property "versionId" should be a string.',
      },
    },
  },
  errorMessage: {
    type: 'AwsS3GetObject request properties should be an object.',
    required: 'AwsS3GetObject request should have required property "key".',
  },
};
