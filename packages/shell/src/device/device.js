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

import { installDevice } from '@lowdefy/blocks-native/device';

import createDevice from './createDevice.js';

// The shell's one device: built and installed when the bundle loads, before any page runs an
// action, so background tasks launched with no screen find it too. Lowdefy Dev installs a wrapped
// copy that answers injected results first (src/dev/inject/withInjectedDevice.js).
const device = createDevice();
installDevice(device.features);

export default device;
