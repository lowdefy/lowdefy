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

import { Share } from 'react-native';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { type } from '@lowdefy/helpers';

// The last segment of a name from page data, so "../" cannot write outside the cache.
function toFileName(name) {
  const base = String(name ?? '')
    .split(/[\\/]/)
    .pop();
  return base === '' || base === '.' || base === '..' ? 'shared-file' : base;
}

// The file to share: a file on the phone as it is, an https file downloaded to the cache first, or
// base64 content written to the cache under its name.
async function toLocalFile({ base64, name, uri }) {
  if (type.isString(base64)) {
    const file = new File(Paths.cache, toFileName(name));
    if (file.exists) file.delete();
    file.create();
    file.write(base64, { encoding: 'base64' });
    return file.uri;
  }
  if (/^https?:\/\//.test(uri)) {
    const file = await File.downloadFileAsync(uri, Paths.cache, { idempotent: true });
    return file.uri;
  }
  return uri;
}

/**
 * The share device feature: the system share sheet with text or a link (React Native's Share), or
 * a file (expo-sharing). Returns { shared }; iOS tells a dismissed sheet apart, Android does not.
 */
function createShareFeature() {
  return async function share({ base64, mimeType, name, text, title, uri, url }) {
    if (type.isString(uri) || type.isString(base64)) {
      const local = await toLocalFile({ base64, name, uri });
      await Sharing.shareAsync(local, { dialogTitle: title, mimeType });
      return { shared: true };
    }
    const result = await Share.share({ message: text ?? url, title, url });
    return { shared: result.action !== Share.dismissedAction };
  };
}

export default createShareFeature;
