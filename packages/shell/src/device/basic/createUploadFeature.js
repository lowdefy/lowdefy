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

import callEndpoint from '../../native/callEndpoint.js';
import { getCurrentApp } from '../../native/currentApp.js';

/**
 * The upload device feature: sends one picked file to an API endpoint as
 * { ...payload, file: { name, mimeType, size, base64 } } and returns the endpoint's answer. The
 * endpoint stores it (S3, a database, the files module) as the app decides.
 */
function createUploadFeature() {
  return async function upload({ endpointId, file, payload }) {
    const base64 = file.base64 ?? (await new File(file.uri).base64());
    return callEndpoint({
      app: await getCurrentApp(),
      endpointId,
      payload: {
        ...payload,
        file: { base64, mimeType: file.mimeType, name: file.name, size: file.size },
      },
    });
  };
}

export default createUploadFeature;
