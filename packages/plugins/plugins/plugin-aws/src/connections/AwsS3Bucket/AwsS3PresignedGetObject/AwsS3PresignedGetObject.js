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
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import createS3Client from '../createS3Client.js';
import getPublicUrl from '../getPublicUrl.js';
import schema from './schema.js';

async function AwsS3PresignedGetObject({ request, connection }) {
  const { expires, key, versionId, responseContentDisposition, responseContentType } = request;
  if (request.public === true) {
    return getPublicUrl({ connection, key });
  }
  const params = {
    Bucket: connection.bucket,
    Key: key,
    VersionId: versionId,
    ResponseContentDisposition: responseContentDisposition,
    ResponseContentType: responseContentType,
  };
  const s3 = createS3Client({ connection });
  const command = new GetObjectCommand(params);
  return getSignedUrl(s3, command, { expiresIn: expires });
}

AwsS3PresignedGetObject.schema = schema;
AwsS3PresignedGetObject.meta = {
  checkRead: true,
  checkWrite: false,
};

export default AwsS3PresignedGetObject;
