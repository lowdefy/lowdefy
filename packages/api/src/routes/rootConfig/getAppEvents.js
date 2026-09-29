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

import { serializer } from '@lowdefy/helpers';

// Serialized like page config: the ~k markers, non-enumerable once the artifact
// is read, must reach the browser so app event errors resolve to their config.
async function getAppEvents({ readConfigFile }) {
  const events = await readConfigFile('events.json');
  return serializer.serialize(events);
}

export default getAppEvents;
