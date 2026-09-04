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

import journeySessionKey from '@lowdefy/client/journey/journeySessionKey.js';

// Read, never written: a report must not mint a session the recorder never
// used, and a session that was not sampled carries no journey_event lines to
// pull - the report is still worth having, it just has no trace beside it.
const STORAGE_KEY = journeySessionKey;

function readJourneySessionId(window) {
  try {
    return JSON.parse(window.sessionStorage.getItem(STORAGE_KEY))?.session_id ?? null;
  } catch {
    return null;
  }
}

export default readJourneySessionId;
