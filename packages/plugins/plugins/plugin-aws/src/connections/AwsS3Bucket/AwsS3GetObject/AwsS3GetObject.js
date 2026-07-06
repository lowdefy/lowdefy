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

import { GetObjectCommand } from '@aws-sdk/client-s3';

import createS3Client from '../createS3Client.js';
import schema from './schema.js';

// Server-side read: returns the object content as a base64 string so routine
// steps can process it with operators and pass it to other steps (base64
// survives JSON serialization; consumers decode with Buffer.from(content, 'base64')).
async function AwsS3GetObject({ request, connection }) {
  const { bucket } = connection;
  const { key, versionId } = request;
  const params = {
    Bucket: bucket,
    Key: key,
  };
  if (versionId) {
    params.VersionId = versionId;
  }
  const s3 = createS3Client({ connection });
  const response = await s3.send(new GetObjectCommand(params));
  const bytes = await response.Body.transformToByteArray();
  const result = {
    bucket,
    key,
    content: Buffer.from(bytes).toString('base64'),
  };
  if (response.ContentType) {
    result.contentType = response.ContentType;
  }
  if (response.ContentLength !== undefined) {
    result.size = response.ContentLength;
  }
  return result;
}

AwsS3GetObject.schema = schema;
AwsS3GetObject.meta = {
  checkRead: true,
  checkWrite: false,
};

export default AwsS3GetObject;
