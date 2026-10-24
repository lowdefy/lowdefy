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

import getDeviceFeature from '../../device/getDeviceFeature.js';

// Opens the share sheet with text, a URL or a file: a file on the phone (uri), an https file the
// shell downloads first (uri), or content made on the page (base64 with a name, like a PDF).
// Returns { shared }, false when the person dismissed the sheet (iOS; Android cannot tell). Every
// shell.
async function Share({ params }) {
  if (!type.isObject(params)) {
    throw new Error(
      `Share requires { text, url, uri, title }. Received ${JSON.stringify(params)}.`
    );
  }
  const { base64, mimeType, name, text, title, uri, url } = params;
  if (![text, url, uri, base64].some(type.isString)) {
    throw new Error(
      `Share requires "text", "url", "uri" or "base64". Received ${JSON.stringify(params)}.`
    );
  }
  if (type.isString(base64) && !type.isString(name)) {
    throw new Error('Share with "base64" requires the file "name", like "report.pdf".');
  }
  return getDeviceFeature({ feature: 'share', action: 'Share' })({
    base64,
    mimeType,
    name,
    text,
    title,
    uri,
    url,
  });
}

export default Share;
