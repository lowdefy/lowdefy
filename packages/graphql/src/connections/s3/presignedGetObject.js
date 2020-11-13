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
import { get } from '@lowdefy/helpers';
import Ajv from 'ajv';

import s3BucketConnectionSchema from './s3BucketConnectionSchema';
import s3PresignedGetObjectSchema from './s3PresignedGetObjectSchema';

function validateConnection({ ajv, connection, context }) {
  const validConnection = ajv.validate(s3BucketConnectionSchema, connection);
  if (!validConnection) {
    throw new context.ConfigurationError(
      `${ajv.errors.map(
        (err) => ` AwsS3Bucket 'connection${err.dataPath.replace(/\//g, '.')}' - ${err.message}`
      )}`
    );
  }
  if (!get(connection, 'read', { default: true })) {
    throw new context.ConfigurationError('AWS S3 Bucket does not allow reads');
  }
}

function validateRequest({ ajv, request, context }) {
  const validConnection = ajv.validate(s3PresignedGetObjectSchema, request);
  if (!validConnection) {
    throw new context.ConfigurationError(
      `${ajv.errors.map(
        (err) => ` AwsS3Bucket 'request${err.dataPath.replace(/\//g, '.')}' - ${err.message}`
      )}`
    );
  }
}

function presignedGetObject({ request, connection, context }) {
  try {
    const ajv = new Ajv({
      allErrors: true,
    });
    validateConnection({ ajv, connection, context });
    validateRequest({ ajv, request, context });

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
  } catch (error) {
    if (error instanceof context.ConfigurationError || error instanceof context.RequestError) {
      throw error;
    }
    throw new context.RequestError(error.message);
  }
}

export default presignedGetObject;
