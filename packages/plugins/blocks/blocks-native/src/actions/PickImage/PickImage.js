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

// Picks photos and videos from Photos (the system picker, which needs no permission). Returns
// [{ name, mimeType, size, uri, width, height, duration?, base64? }], [] when cancelled. Every
// shell.
async function PickImage({ params = {} }) {
  const { upload, ...options } = params;
  const files = await getDeviceFeature({ feature: 'photos', action: 'PickImage' }).pick(options);
  return uploadFiles({ action: 'PickImage', files, upload });
}

export default PickImage;
