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

import isNativeAuthRequest from './isNativeAuthRequest.js';
import sha256Base64Url from './sha256Base64Url.js';

const DEVICE_KEY = /^[A-Za-z0-9_-]{32,128}$/;

// The SHA-256 of the per-phone device key a shell sends on its email-code calls
// (x-lowdefy-device-key), or null when the request is not a shell's own or carries
// no well-formed key. The key is a secret only that phone holds, so the server
// keeps only its hash.
function readDeviceKeyHash({ request }) {
  if (!isNativeAuthRequest({ request })) {
    return null;
  }
  const key = request.headers.get('x-lowdefy-device-key');
  if (key === null || !DEVICE_KEY.test(key)) {
    return null;
  }
  return sha256Base64Url(key);
}

export default readDeviceKeyHash;
