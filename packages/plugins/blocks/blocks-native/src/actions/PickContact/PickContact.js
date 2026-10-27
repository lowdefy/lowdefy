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

// Opens the phone's contact picker. Returns { id, name, firstName, lastName, company, emails,
// phoneNumbers }, or null when cancelled. Shells with the contacts extension.
async function PickContact({ params }) {
  return getDeviceFeature({ feature: 'contacts', action: 'PickContact' }).pick(params ?? {});
}

export default PickContact;
