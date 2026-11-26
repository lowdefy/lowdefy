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

import { type } from '@lowdefy/helpers';

import { openMutantRun } from '../../server/mutants/mutantRuns.js';
import runJourneyHeadless from '../runJourneyHeadless.js';

// One posted headless journey in the thread that runs it (journeyWorker.js): `params` are
// runJourneyHeadless's, as the journey route read them, and `mutant` the route's validated mutant,
// or null. A mutant run opens here, in this thread's registry, since the journey's API contexts
// read it there (createLowdefyContext); it closes once the journey has closed every actor, so no
// call still carries its cookie. Answers { result, mutant }: runJourneyHeadless's result, and the
// mutant run's { id, applied, misses }, or null.
async function runHeadlessJob({ params, mutant, pageBuilds, getStore }) {
  const mutantRun = type.isNone(mutant) ? null : openMutantRun({ mutant });
  try {
    const result = await runJourneyHeadless({
      ...params,
      mutantCookie: mutantRun?.cookiePayload,
      pageBuilds,
      getStore,
    });
    if (mutantRun === null) {
      return { result, mutant: null };
    }
    const { id, applied, misses } = mutantRun.run;
    return { result, mutant: { id, applied, misses } };
  } finally {
    mutantRun?.close();
  }
}

export default runHeadlessJob;
