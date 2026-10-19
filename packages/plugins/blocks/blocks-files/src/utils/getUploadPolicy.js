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

// Triggers the block's registered __getUploadPolicy event and returns the
// upload-policy descriptor { method, url, key, bucket, fields | headers }
// produced by the app's upload-policy request.
async function getUploadPolicy({ methods, file }) {
  const { lastModified, name, size, type, uid } = file;
  const response = await methods.triggerEvent({
    name: '__getUploadPolicy',
    event: { file: { name, lastModified, size, type, uid } },
  });
  if (response.success !== true) {
    throw new Error('Upload policy request error.');
  }
  return response.responses.__getUploadPolicy.response[0];
}

export default getUploadPolicy;
