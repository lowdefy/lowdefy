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

import { hasDeviceFeature } from '../../device/getDeviceFeature.js';

const SOURCES = [
  { id: 'photos', feature: 'photos', title: 'Photo Library', sfSymbol: 'photo.on.rectangle' },
  { id: 'camera', feature: 'camera', title: 'Take Photo', sfSymbol: 'camera' },
  { id: 'files', feature: 'files', title: 'Choose File', sfSymbol: 'folder' },
];

/**
 * The places a FileInput picks from, in menu order: those its `sources` names (all by default) that
 * the shell carries. The camera is in shells with the camera (profile field).
 *
 * @param {string[]} [sources]
 */
function getFileSources(sources) {
  return SOURCES.filter(
    (source) =>
      (sources ?? ['photos', 'camera', 'files']).includes(source.id) &&
      hasDeviceFeature(source.feature)
  );
}

export default getFileSources;
