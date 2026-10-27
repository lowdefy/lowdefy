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

// Scans paper with the camera: the system document scanner finds the page edges, crops and
// straightens each page (VisionKit on iOS, ML Kit on Android). Returns the pages as JPEG files in
// the PickFile shape, [] when cancelled. Shells with the camera (profile field).
async function ScanDocument({ params = {} }) {
  const { upload, ...options } = params;
  const files = await getDeviceFeature({
    feature: 'documentScanner',
    action: 'ScanDocument',
  })(options);
  return uploadFiles({ action: 'ScanDocument', files, upload });
}

export default ScanDocument;
