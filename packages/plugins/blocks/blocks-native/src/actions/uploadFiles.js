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

import getDeviceFeature from '../device/getDeviceFeature.js';

/**
 * Uploads picked files to an API endpoint, one call per file, when the action names
 * `upload: { endpointId, payload? }`. Each file is sent as `{ ...payload, file }` with its content
 * base64 encoded, and comes back with the endpoint's answer as `upload`.
 *
 * @param {Object} params
 * @param {string} params.action The action, for errors.
 * @param {Object[]} params.files The picked files.
 * @param {{ endpointId: string, payload?: Object }} [params.upload]
 */
async function uploadFiles({ action, files, upload }) {
  if (type.isNone(upload)) {
    return files;
  }
  if (!type.isObject(upload) || !type.isString(upload.endpointId)) {
    throw new Error(
      `${action} "upload" should be { endpointId, payload? }. Received ${JSON.stringify(upload)}.`
    );
  }
  const send = getDeviceFeature({ feature: 'upload', action });
  const uploaded = [];
  for (const file of files) {
    const response = await send({
      endpointId: upload.endpointId,
      file,
      payload: upload.payload ?? {},
    });
    uploaded.push({ ...file, upload: response });
  }
  return uploaded;
}

export default uploadFiles;
