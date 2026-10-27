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

import { File } from 'expo-file-system';

// A file name for a picked asset that has none (a camera photo on Android): its kind and the time.
function fallbackName({ mimeType }) {
  const extension = (mimeType ?? 'application/octet-stream').split('/')[1] ?? 'bin';
  return `file-${Date.now()}.${extension}`;
}

/**
 * A picked image, video or document as the native actions return it:
 * { name, mimeType, size, uri, width?, height?, duration?, base64? }.
 *
 * @param {Object} params
 * @param {Object} params.asset An expo-image-picker or expo-document-picker asset.
 * @param {boolean} [params.base64] Read the content as base64 too.
 */
async function toPickedFile({ asset, base64 = false }) {
  const mimeType = asset.mimeType ?? null;
  const file = {
    name: asset.fileName ?? asset.name ?? fallbackName({ mimeType }),
    mimeType,
    size: asset.fileSize ?? asset.size ?? new File(asset.uri).size ?? null,
    uri: asset.uri,
  };
  if (typeof asset.width === 'number') {
    file.width = asset.width;
    file.height = asset.height;
  }
  if (typeof asset.duration === 'number') {
    file.duration = asset.duration;
  }
  if (base64) {
    file.base64 = asset.base64 ?? (await new File(asset.uri).base64());
  }
  return file;
}

export default toPickedFile;
