/*
  Copyright 2020 Lowdefy, Inc

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

const s3PresignedGetObjectSchema = {
  type: 'object',
  required: ['key'],
  properties: {
    expires: {
      type: 'number',
      description: 'Number of seconds for which the policy should be valid.',
      default: 3600,
    },
    key: {
      type: 'string',
      description: 'Key under which object is stored.',
    },
    versionId: {
      type: 'string',
      description: 'VersionId used to reference a specific version of the object.',
    },
    responseContentType: {
      type: 'string',
      description: 'Sets the Content-Type header of the response.',
    },
    responseContentDisposition: {
      type: 'string',
      description: 'Sets the Content-Disposition header of the response.',
    },
  },
};

export default s3PresignedGetObjectSchema;
