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

import { HeadObjectCommand } from '@aws-sdk/client-s3';
import { type } from '@lowdefy/helpers';

import createS3Client from '../createS3Client.js';
import schema from './schema.js';

// A missing object is an expected answer (e.g. checking a browser upload arrived), so it is
// returned as data for the routine to act on rather than thrown. A HEAD response has no body,
// so S3 reports a missing object only through the 404 status.
async function AwsS3HeadObject({ request, connection }) {
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
  let response;
  try {
    response = await s3.send(new HeadObjectCommand(params));
  } catch (error) {
    if (error.$metadata?.httpStatusCode === 404) {
      return { exists: false, bucket, key };
    }
    throw error;
  }
  const result = {
    exists: true,
    bucket,
    key,
    size: response.ContentLength,
    etag: response.ETag,
    lastModified: response.LastModified,
  };
  if (!type.isNone(response.ContentType)) {
    result.contentType = response.ContentType;
  }
  if (!type.isNone(response.VersionId)) {
    result.versionId = response.VersionId;
  }
  return result;
}

AwsS3HeadObject.schema = schema;
AwsS3HeadObject.meta = {
  checkRead: true,
  checkWrite: false,
};

export default AwsS3HeadObject;
