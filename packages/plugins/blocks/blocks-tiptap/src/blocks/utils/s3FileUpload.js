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

async function s3FileUpload({ file, methods }) {
  if (!file) {
    return;
  }
  const { lastModified, name, size, type, uid } = file;
  const s3PostPolicyResponse = await methods.triggerEvent({
    name: '__getS3PostPolicy',
    event: { file: { name, lastModified, size, type, uid } },
  });

  if (s3PostPolicyResponse.success !== true) {
    throw new Error('S3 post policy request error.');
  }

  const { url, fields } = s3PostPolicyResponse.responses.__getS3PostPolicy.response[0];
  const { bucket, key } = fields;
  file.bucket = bucket;
  file.key = key;

  const formData = new FormData();
  Object.keys(fields).forEach((field) => {
    formData.append(field, fields[field]);
  });
  formData.append('file', file);

  await fetch(url, { method: 'POST', body: formData });
  // createPresignedPost returns the bucket endpoint with a trailing slash, so only
  // add a separator when it is missing to avoid a double slash before the key.
  file.url = url.endsWith('/') ? `${url}${key}` : `${url}/${key}`;
  return file.url;
}

export default s3FileUpload;
