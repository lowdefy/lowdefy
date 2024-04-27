/*
  Copyright 2020-2024 Lowdefy, Inc

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

import AWS from 'aws-sdk';
import schema from './schema.js';
import { type } from '@lowdefy/helpers';

function AwsS3PresignedPostPolicy({ request, connection }) {
  const { accessKeyId, secretAccessKey, region, bucket } = connection;
  const { acl, conditions, expires, key, fields = {} } = request;
  const params = {
    Bucket: bucket,
    Fields: {
      key,
    },
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
  const s3 = new AWS.S3({ accessKeyId, secretAccessKey, region, bucket });
  return s3.createPresignedPost(params);
}

AwsS3PresignedPostPolicy.schema = schema;
AwsS3PresignedPostPolicy.meta = {
  checkRead: false,
  checkWrite: true,
};

export default AwsS3PresignedPostPolicy;
