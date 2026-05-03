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

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import schema from './schema.js';

async function AwsS3PutObject({ request, connection }) {
  const { accessKeyId, secretAccessKey, region, bucket } = connection;
  const { key, body, contentType, acl, metadata } = request;

  const params = {
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType ?? 'application/octet-stream',
  };
  if (acl) {
    params.ACL = acl;
  }
  if (metadata) {
    params.Metadata = metadata;
  }

  const s3 = new S3Client({
    credentials: { accessKeyId, secretAccessKey },
    region,
  });
  const result = await s3.send(new PutObjectCommand(params));
  return {
    bucket,
    key,
    etag: result?.ETag,
    versionId: result?.VersionId,
  };
}

AwsS3PutObject.schema = schema;
AwsS3PutObject.meta = {
  checkRead: false,
  checkWrite: true,
};

export default AwsS3PutObject;
