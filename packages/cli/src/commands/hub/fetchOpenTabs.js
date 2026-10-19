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

import { devPassiveHeader } from '@lowdefy/node-utils';

// A dev server that stopped answering must not hold up the reaper.
const OPEN_TABS_TIMEOUT_MS = 5000;

// How many browser tabs have the dev server open. A tab keeps an idle server
// alive; a server that cannot say counts as having none.
async function fetchOpenTabs({ url, timeoutMs = OPEN_TABS_TIMEOUT_MS }) {
  try {
    // Passive: asking whether a server is in use must not count as using it.
    const response = await fetch(`${url}/api/dev-inspect`, {
      headers: { [devPassiveHeader]: '1' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const { tabs } = await response.json();
    return tabs.length;
  } catch {
    return 0;
  }
}

export default fetchOpenTabs;
