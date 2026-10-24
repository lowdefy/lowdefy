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

// Stops the voice note and returns it as { name, mimeType, size, uri, duration }, with the
// endpoint answer as upload when `upload` is set. Shells with audio recording (profile field).
async function StopRecording({ params }) {
  const { upload, ...options } = params ?? {};
  const file = await getDeviceFeature({ feature: 'audio', action: 'StopRecording' }).stop(options);
  if (file === null) {
    return null;
  }
  const [uploaded] = await uploadFiles({ action: 'StopRecording', files: [file], upload });
  return uploaded;
}

export default StopRecording;
