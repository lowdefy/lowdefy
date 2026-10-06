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

import fetchBuildId from '../../test/fetchBuildId.js';
import runJourney from '../../test/runJourney.js';
import toVerdict from './toVerdict.js';

// Runs one (mutant, journey) pair: the journey POST with the mutant, as
// listed against `buildId`. A 409 stale, or a build id that changed during
// the run, discards the verdict: the run may have mutated another node. A
// runner error is retried once.
async function runMutantPair({ pair, url, buildId }) {
  const { mutant, baseline } = pair;
  const body = {
    buildId,
    artifact: mutant.artifact,
    key: mutant.key,
    arg: mutant.arg,
    operator: mutant.operator,
  };
  let outcome;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = await runJourney({ item: baseline.item, url, mutant: body });
    if (result.stale === true || (await fetchBuildId({ url })) !== buildId) {
      return { buildChanged: true };
    }
    outcome = { ...toVerdict(result), durationMs: result.durationMs };
    if (outcome.verdict !== 'error') {
      return outcome;
    }
  }
  return outcome;
}

export default runMutantPair;
