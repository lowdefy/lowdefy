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

function AwsS3PresignedGetObject({ request, connection }) {
  const { accessKeyId, secretAccessKey, region, bucket } = connection;
  const { expires, key, versionId, responseContentDisposition, responseContentType } = request;
  const params = {
    Bucket: bucket,
    Key: key,
    Expires: expires,
    VersionId: versionId,
    ResponseContentDisposition: responseContentDisposition,
    ResponseContentType: responseContentType,
  };
  const s3 = new AWS.S3({ accessKeyId, secretAccessKey, region, bucket });
  return s3.getSignedUrl('getObject', params);
}

AwsS3PresignedGetObject.schema = schema;
AwsS3PresignedGetObject.meta = {
  checkRead: true,
  checkWrite: false,
};

export default AwsS3PresignedGetObject;
