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

import { getCurrentApp } from '../../native/currentApp.js';

/**
 * Lowdefy Dev's share injection: as if `{ text?, url?, files? }` were shared into the app from
 * another app, so mobile.share.pageId opens with it and onShare fires. Files are
 * [{ uri, name, mimeType, size? }].
 *
 * @param {Object} value
 */
async function injectShare(value) {
  if (
    !type.isObject(value) ||
    ![value.text, value.url, value.files].some((item) => !type.isNone(item))
  ) {
    throw new Error(
      `A share injection needs { text?, url?, files? }. Received ${JSON.stringify(value)}.`
    );
  }
  const payloads = [
    ...(type.isString(value.text) ? [{ shareType: 'text', value: value.text }] : []),
    ...(type.isString(value.url) ? [{ shareType: 'url', value: value.url }] : []),
    ...(value.files ?? []).map((file) => ({
      shareType: 'file',
      value: file.uri,
      contentUri: file.uri,
      contentType: 'file',
      contentMimeType: file.mimeType ?? null,
      originalName: file.name ?? null,
      contentSize: file.size ?? null,
    })),
  ];
  const app = await getCurrentApp();
  await app.receiveShare({ payloads });
  return { ok: true, kind: 'share' };
}

export default injectShare;
