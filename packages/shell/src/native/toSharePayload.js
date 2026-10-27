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

/**
 * What was shared into the app, from expo-sharing's resolved payloads: { text, urls, files }, files
 * as [{ name, mimeType, size, uri, type }] (type: image, video, audio or file).
 *
 * @param {Object[]} payloads expo-sharing ResolvedSharePayloads.
 */
function toSharePayload(payloads) {
  const texts = [];
  const urls = [];
  const files = [];
  payloads.forEach((payload) => {
    if (payload.shareType === 'text') {
      texts.push(payload.value);
      return;
    }
    if (payload.shareType === 'url' || payload.contentType === 'website') {
      urls.push(payload.value);
      return;
    }
    files.push({
      name: payload.originalName ?? payload.value.split('/').pop(),
      mimeType: payload.contentMimeType ?? payload.mimeType ?? null,
      size: payload.contentSize ?? null,
      uri: payload.contentUri ?? payload.value,
      type: payload.contentType ?? payload.shareType,
    });
  });
  return { text: texts.length === 0 ? null : texts.join('\n'), urls, files };
}

export default toSharePayload;
