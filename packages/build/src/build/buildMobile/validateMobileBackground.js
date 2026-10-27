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

import { checkKeys, checkObject, checkOptionalNumber, checkString } from './mobileChecks.js';

// mobile.background: the endpoint a shell calls from background fetch while the app is closed, and
// the shortest interval between runs in minutes (the phone decides the real timing; at least 15).
function validateMobileBackground({ background, configKey, context }) {
  const path = 'mobile.background';
  if (!checkObject({ value: background, path, configKey, context })) {
    return;
  }
  const key = background['~k'] ?? configKey;
  checkKeys({
    object: background,
    allowed: ['endpointId', 'interval'],
    path,
    configKey: key,
    context,
  });
  checkString({
    value: background.endpointId,
    path: `${path}.endpointId`,
    configKey: key,
    context,
  });
  checkOptionalNumber({
    value: background.interval,
    minimum: 15,
    path: `${path}.interval`,
    configKey: key,
    context,
  });
}

export default validateMobileBackground;
