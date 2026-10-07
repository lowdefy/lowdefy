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

import { DeleteObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { type } from '@lowdefy/helpers';

import createS3Client from '../createS3Client.js';
import schema from './schema.js';

// Deletes only from the connection's bucket. S3 answers a delete of a key that does not exist as
// a success, so such a key is returned as deleted. With several keys, S3 reports each key it could
// not delete in the response instead of failing the call, so those come back as errors.
async function AwsS3DeleteObject({ request, connection }) {
  const { bucket } = connection;
  const { key, keys } = request;
  const s3 = createS3Client({ connection });
  if (!type.isNone(key)) {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    return { bucket, deleted: [key], errors: [] };
  }
  const response = await s3.send(
    new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: keys.map((objectKey) => ({ Key: objectKey })),
        Quiet: false,
      },
    })
  );
  return {
    bucket,
    deleted: (response.Deleted ?? []).map((deleted) => deleted.Key),
    errors: (response.Errors ?? []).map((error) => ({
      key: error.Key,
      code: error.Code,
      message: error.Message,
    })),
  };
}

AwsS3DeleteObject.schema = schema;
AwsS3DeleteObject.meta = {
  checkRead: false,
  checkWrite: true,
};

export default AwsS3DeleteObject;
