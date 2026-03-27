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

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import schema from './schema.js';

async function AwsS3PresignedGetObject({ request, connection }) {
  const { accessKeyId, secretAccessKey, region } = connection;
  const { expires, key, versionId, responseContentDisposition, responseContentType } = request;
  const params = {
    Bucket: connection.bucket,
    Key: key,
    VersionId: versionId,
    ResponseContentDisposition: responseContentDisposition,
    ResponseContentType: responseContentType,
  };
  const s3 = new S3Client({
    credentials: { accessKeyId, secretAccessKey },
    region,
  });
  const command = new GetObjectCommand(params);
  return getSignedUrl(s3, command, { expiresIn: expires });
}

AwsS3PresignedGetObject.schema = schema;
AwsS3PresignedGetObject.meta = {
  checkRead: true,
  checkWrite: false,
};

export default AwsS3PresignedGetObject;
