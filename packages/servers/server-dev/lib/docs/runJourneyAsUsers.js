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

import { createTraceId } from '@lowdefy/helpers';

import runJourney from './runJourney.js';

// lowdefy_run_journey with a list of data set user names: the journey runs
// once as each user, in order, each in a fresh data session and recorded as a
// run of its own. Returns { passed, runs: [{ user, ...result }] }; passed only
// when every run passed. A run the runner could not do (its user not in the
// data set, no browser) is that run's { user, passed: false, error }, so the
// other runs still report.
async function runJourneyAsUsers({ users, ...params }) {
  const runs = [];
  for (const user of users) {
    const result = await runJourney({
      ...params,
      user,
      recording: { source: 'journey', run: { id: createTraceId(), by: 'agent', journey: null } },
    });
    if (result.error) {
      runs.push({ user, passed: false, error: result.error });
      continue;
    }
    runs.push({ user, ...result });
  }
  return { passed: runs.every((run) => run.passed === true), runs };
}

export default runJourneyAsUsers;
