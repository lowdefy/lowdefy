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

// Takes a photo (or a video, mediaTypes: [videos]) with the camera. Returns the PickImage shape,
// [] when cancelled. Shells with the camera (profile field).
async function TakePhoto({ params = {} }) {
  const { upload, ...options } = params;
  const files = await getDeviceFeature({ feature: 'camera', action: 'TakePhoto' }).takePhoto(
    options
  );
  return uploadFiles({ action: 'TakePhoto', files, upload });
}

export default TakePhoto;
