/*
  Copyright 2020 Lowdefy, Inc

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

import schema from './AwsS3PresignedPostPolicySchema.json';
import checkConnectionWrite from '../../../utils/checkConnectionWrite';

function awsS3PresignedPostPolicy({ request, connection, context }) {
  checkConnectionWrite({ connection, context, connectionType: 'AwsS3Bucket' });
  try {
    const { accessKeyId, secretAccessKey, region, bucket } = connection;
    const { acl, conditions, expires, key } = request;
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
    const s3 = new AWS.S3({ accessKeyId, secretAccessKey, region, bucket });
    return s3.createPresignedPost(params);
  } catch (error) {
    throw new context.RequestError(error.message);
  }
}

export default { resolver: awsS3PresignedPostPolicy, schema };
