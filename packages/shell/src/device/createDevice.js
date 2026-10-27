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

import * as calendarEntry from './calendar/index.js';
import * as contactsEntry from './contacts/index.js';
import createFilesFeature from './basic/createFilesFeature.js';
import createHapticsFeature from './basic/createHapticsFeature.js';
import createKeepAwakeFeature from './basic/createKeepAwakeFeature.js';
import createNotificationsFeature from '../notifications/createNotificationsFeature.js';
import createPhotosFeature from './basic/createPhotosFeature.js';
import createRequestQueueFeature from './basic/createRequestQueueFeature.js';
import createShareFeature from './basic/createShareFeature.js';
import createSpeechFeature from './basic/createSpeechFeature.js';
import createUploadFeature from './basic/createUploadFeature.js';
import * as fieldEntry from './field/index.js';
import * as nfcEntry from './nfc/index.js';
import * as trackingEntry from './tracking/index.js';
import * as widgetsEntry from '../widgets/index.js';

// The feature modules of profiles and extensions (profiles.js jsEntries). A shell that does not
// carry one resolves it to an empty module (metro.config.js), which has no `features`.
const ENTRIES = [fieldEntry, nfcEntry, trackingEntry, contactsEntry, calendarEntry, widgetsEntry];

/**
 * The device features this shell carries, for blocks-native's device registry (installDevice): the
 * ones every shell has, and those of the profile and extensions it was built with. `hosts` are the
 * views features open at the root, such as the ScanCode sheet (DeviceHosts).
 *
 * @returns {{ features: Object, hosts: Function[] }}
 */
function createDevice() {
  const carried = ENTRIES.filter((entry) => entry.features !== undefined);
  return {
    features: Object.assign(
      {
        files: createFilesFeature(),
        haptics: createHapticsFeature(),
        keepAwake: createKeepAwakeFeature(),
        notifications: createNotificationsFeature(),
        photos: createPhotosFeature(),
        requestQueue: createRequestQueueFeature(),
        share: createShareFeature(),
        speech: createSpeechFeature(),
        upload: createUploadFeature(),
      },
      ...carried.map((entry) => entry.features)
    ),
    hosts: carried.flatMap((entry) => entry.hosts),
  };
}

export default createDevice;
