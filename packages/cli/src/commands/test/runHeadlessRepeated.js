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

import formatJourneyResult from './formatJourneyResult.js';
import runJourneyHeadless from './runJourneyHeadless.js';
import runRepeated from './runRepeated.js';

// The suite a --build run reports its headless journeys with: the PASS and FAIL lines are
// formatJourneyResult's.
const headlessSuite = { name: 'journeys', format: formatJourneyResult };

// Runs one test item of a --build run `repeat` times (runRepeated) on the production build's test
// app `app`, each run headless on a fresh session of its data set (runJourneyHeadless). The same
// call runs a journey in the run's own thread and in each of its worker threads (headlessWorker),
// so a journey runs the same wherever the pool puts it.
async function runHeadlessRepeated({ app, context, item, repeat }) {
  return runRepeated({
    suite: {
      ...headlessSuite,
      run: ({ item: run }) => runJourneyHeadless({ app, context, item: run }),
    },
    context,
    item,
    repeat,
  });
}

export { headlessSuite };
export default runHeadlessRepeated;
