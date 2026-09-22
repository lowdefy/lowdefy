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

import identifiedIdStorageKey from './identifiedIdStorageKey.js';

// Which person this browser last identified as. PostHog refuses to move an
// already identified distinct_id onto a different person, so a shared browser
// must be reset before the next person is identified. get_distinct_id() cannot
// answer this on its own: it returns an anonymous uuid before identify() and
// the person id afterwards, with no way to tell those two apart. The marker
// can: no marker means "anonymous so far", so identify() may merge the
// anonymous session into the new person, which is what makes signup funnels
// work. A different marker means a person swap, which needs reset() first.
function readIdentifiedId({ window }) {
  try {
    return window.localStorage.getItem(identifiedIdStorageKey);
  } catch (error) {
    // Private mode or blocked storage. Treat as "never identified".
    return null;
  }
}

export default readIdentifiedId;
