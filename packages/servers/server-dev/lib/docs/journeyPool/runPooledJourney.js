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

import createJourneyHost from './createJourneyHost.js';
import getJourneyPool from './getJourneyPool.js';

// Runs one posted headless journey on the dev server's journey pool: `params` are
// runJourneyHeadless's, `mutant` the route's validated mutant or null, and `pageBuilds` the main
// thread's (createLocalPageBuilds), which build the journey's pages. Answers { result, mutant }
// (runHeadlessJob), or throws when the thread running it stopped.
function runPooledJourney({ params, mutant, pageBuilds }) {
  const { pool, storeThreads } = getJourneyPool();
  return pool.run({ params, mutant, host: createJourneyHost({ pageBuilds, storeThreads }) });
}

export default runPooledJourney;
