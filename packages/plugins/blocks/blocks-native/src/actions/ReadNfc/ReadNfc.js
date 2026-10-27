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

// Waits for an NFC tag and reads it. Returns { id, type, records: [{ type, text?, uri?, payload }]
// }, or null when the person cancels. Shells with NFC (profile field-nfc).
async function ReadNfc({ params }) {
  return getDeviceFeature({ feature: 'nfc', action: 'ReadNfc' }).read(params ?? {});
}

export default ReadNfc;
