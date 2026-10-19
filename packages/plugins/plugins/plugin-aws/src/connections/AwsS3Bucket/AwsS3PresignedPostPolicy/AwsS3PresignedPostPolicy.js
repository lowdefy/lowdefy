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

import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import createS3Client from '../createS3Client.js';
import schema from './schema.js';

async function AwsS3PresignedPostPolicy({ request, connection }) {
  const { bucket } = connection;
  const { acl, conditions, expires, key, fields = {} } = request;
  const params = {
    Bucket: bucket,
    Key: key,
    Fields: {},
  };
  if (conditions) {
    params.Conditions = conditions;
  }
  if (expires) {
    params.Expires = expires;
  }
  if (acl) {
    params.Fields.acl = acl;
  }
  if (type.isObject(fields) === false) {
    throw new ConfigError('AwsS3PresignedPostPolicy request "fields" must be an object.');
  }
  Object.keys(fields).forEach((field) => {
    if (fields[field]) {
      // S3 user metadata values must be ASCII. URL-encode x-amz-meta-* values so
      // non-ASCII characters (names, URLs, etc.) survive the round trip. Other
      // protocol fields (acl, Content-Type, ...) must be passed through literally.
      params.Fields[field] = field.toLowerCase().startsWith('x-amz-meta-')
        ? encodeURIComponent(fields[field])
        : fields[field];
    }
  });
  const s3 = createS3Client({ connection });
  const policy = await createPresignedPost(s3, params);
  // Top-level key/bucket/method make the response a standard upload-policy
  // descriptor — the client reads object identity from here, never from fields.
  return {
    ...policy,
    bucket,
    key,
    method: 'POST',
  };
}

AwsS3PresignedPostPolicy.schema = schema;
AwsS3PresignedPostPolicy.meta = {
  checkRead: false,
  checkWrite: true,
};

export default AwsS3PresignedPostPolicy;
