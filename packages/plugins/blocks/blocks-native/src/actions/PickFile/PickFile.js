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

import getDeviceFeature from '../../device/getDeviceFeature.js';
import uploadFiles from '../uploadFiles.js';

// Picks files from Files (iOS) or the document picker (Android). Returns
// [{ name, mimeType, size, uri, base64? }], [] when cancelled, each with the endpoint's answer as
// `upload` when `upload` is set. Every shell.
async function PickFile({ params = {} }) {
  const { upload, ...options } = params;
  const files = await getDeviceFeature({ feature: 'files', action: 'PickFile' }).pick(options);
  return uploadFiles({ action: 'PickFile', files, upload });
}

export default PickFile;
