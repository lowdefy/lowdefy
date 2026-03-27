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

import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import schema from './schema.js';
import { type } from '@lowdefy/helpers';

async function AwsS3PresignedPostPolicy({ request, connection }) {
  const { accessKeyId, secretAccessKey, region, bucket } = connection;
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
    throw new Error('properties.fields must be an object.');
  }
  Object.keys(fields).forEach((field) => {
    if (fields[field]) {
      params.Fields[field] = fields[field];
    }
  });
  const s3 = new S3Client({
    credentials: { accessKeyId, secretAccessKey },
    region,
  });
  return createPresignedPost(s3, params);
}

AwsS3PresignedPostPolicy.schema = schema;
AwsS3PresignedPostPolicy.meta = {
  checkRead: false,
  checkWrite: true,
};

export default AwsS3PresignedPostPolicy;
