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
import { type } from '@lowdefy/helpers';

function createS3Client({ connection }) {
  const { accessKeyId, secretAccessKey, region, endpoint, forcePathStyle } = connection;
  const config = {
    credentials: { accessKeyId, secretAccessKey },
    region,
  };
  if (!type.isNone(endpoint)) {
    config.endpoint = endpoint;
  }
  if (!type.isNone(forcePathStyle)) {
    config.forcePathStyle = forcePathStyle;
  }
  return new S3Client(config);
}

export default createS3Client;
