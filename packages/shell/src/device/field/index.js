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

import createAudioFeature from './createAudioFeature.js';
import createBrightnessFeature from './createBrightnessFeature.js';
import createCameraFeature from './createCameraFeature.js';
import createDocumentScannerFeature from './createDocumentScannerFeature.js';
import createLocationFeature from './createLocationFeature.js';
import MapView from './MapView.js';
import ScanCodeSheet from './ScanCodeSheet.js';

// The `field` profile's device features (profiles.js FIELD_ENTRY). A shell on another profile
// resolves this module to an empty one (metro.config.js), so it links none of their modules.
const features = {
  audio: createAudioFeature(),
  brightness: createBrightnessFeature(),
  camera: createCameraFeature(),
  documentScanner: createDocumentScannerFeature(),
  location: createLocationFeature(),
  maps: { MapView },
};

// Views the features open at the root (DeviceHosts).
const hosts = [ScanCodeSheet];

export { features, hosts };
