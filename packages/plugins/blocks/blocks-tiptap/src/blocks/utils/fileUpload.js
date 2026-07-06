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

import { type } from '@lowdefy/helpers';
import getLegacyObjectUrl from '@lowdefy/blocks-files/utils/getLegacyObjectUrl.js';
import getUploadPolicy from '@lowdefy/blocks-files/utils/getUploadPolicy.js';
import uploadFile from '@lowdefy/blocks-files/utils/uploadFile.js';

// Uploads a file through the app's upload-policy request (any storage
// provider) and resolves a display URL for the inline image. Inline images
// persist in saved markdown, so they must be public assets: the upload
// request should set the provider's public-read acl, and the download request
// should set public: true to return a stable, non-expiring URL. Without a
// download request the legacy unsigned object URL is used (S3-shaped,
// deprecated).
async function fileUpload({ file, methods, hasDownloadRequest }) {
  if (type.isNone(file)) {
    return;
  }
  const descriptor = await getUploadPolicy({ methods, file });
  file.bucket = descriptor.bucket;
  file.key = descriptor.key;

  await uploadFile({ descriptor, file });

  if (hasDownloadRequest) {
    const response = await methods.triggerEvent({
      name: '__getDownloadPolicy',
      event: {
        file: {
          bucket: descriptor.bucket,
          key: descriptor.key,
          name: file.name,
          type: file.type,
        },
      },
    });
    if (response.success !== true) {
      throw new Error('Download policy request error.');
    }
    file.url = response.responses.__getDownloadPolicy.response[0];
    return file.url;
  }
  file.url = getLegacyObjectUrl({ descriptor });
  return file.url;
}

export default fileUpload;
