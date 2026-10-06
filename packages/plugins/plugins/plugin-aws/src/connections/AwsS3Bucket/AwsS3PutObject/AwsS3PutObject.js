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

import { PutObjectCommand } from '@aws-sdk/client-s3';
import { type } from '@lowdefy/helpers';

import copyFromUrl from './copyFromUrl.js';
import createS3Client from '../createS3Client.js';
import schema from './schema.js';

// Server-side write. With `content`, stores base64 content as an object: used by API endpoint
// routines that receive files as endpoint payloads (emitFileContent + CallAPI). With `url`,
// streams what an https link answers into the bucket, so a file handed over as a presigned link
// never passes through the routine.
async function AwsS3PutObject({ request, connection }) {
  const { bucket } = connection;
  const { acl, content, contentType, key, url } = request;
  const params = {
    Bucket: bucket,
    Key: key,
  };
  if (acl) {
    params.ACL = acl;
  }
  const s3 = createS3Client({ connection });
  if (!type.isNone(url)) {
    return copyFromUrl({ s3, params, request });
  }
  params.Body = Buffer.from(content, 'base64');
  if (contentType) {
    params.ContentType = contentType;
  }
  await s3.send(new PutObjectCommand(params));
  return { bucket, key, size: params.Body.length, contentType: contentType ?? null };
}

AwsS3PutObject.schema = schema;
AwsS3PutObject.meta = {
  checkRead: false,
  checkWrite: true,
  // A presigned url carries its signature.
  credentialProperties: ['url'],
};

export default AwsS3PutObject;
