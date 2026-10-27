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

import getDeviceFeature from '../../device/getDeviceFeature.js';

// Sets the number on the app icon; 0 clears it. Every shell.
async function SetBadgeCount({ params }) {
  if (type.isNone(params?.count)) {
    throw new Error(`SetBadgeCount requires "count". Received ${JSON.stringify(params)}.`);
  }
  return getDeviceFeature({ feature: 'notifications', action: 'SetBadgeCount' }).setBadgeCount(
    params ?? {}
  );
}

export default SetBadgeCount;
