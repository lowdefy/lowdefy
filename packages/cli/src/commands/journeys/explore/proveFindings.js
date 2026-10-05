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

import fs from 'fs';
import YAML from 'yaml';
import { type } from '@lowdefy/helpers';

import runJourney from '../../test/runJourney.js';

const PROOF_RUNS = 2;

function isEnvironmentFailure(failure) {
  return (failure?.errors ?? []).some((error) => error.kind === 'environment');
}

function lastStepIndex(journey) {
  return journey.steps.length - 1;
}

// Whether one run of a finding's candidate failed with that finding. An app
// error fails with its key in failure.errors, at any step or at open (one
// classifier and one key for walks and journeys). A dead click fails at the
// candidate's final expect: { effect: true }, and a role refusal at its one
// expect: { visible: <pageId> } step, as an expectation and not an app error.
function failsWithFinding({ finding, journey, result }) {
  const { failure } = result;
  if (result.passed === true || type.isNone(failure)) return false;
  if (finding.kind === 'dead-click') {
    return failure.index === lastStepIndex(journey) && failure.step?.expect?.effect === true;
  }
  if (finding.kind === 'role-refused') {
    return (
      failure.kind !== 'app-error' &&
      failure.index === 0 &&
      !type.isUndefined(failure.step?.expect?.visible)
    );
  }
  return (failure.errors ?? []).some((error) => error.key === finding.key);
}

// Runs a candidate up to twice, one run at a time, in process through the
// test command's own runJourney against the server the walks used, recording
// nothing. Returns null when both runs fail with the finding, else the
// not-proven reason.
async function proveCandidate({ context, url, finding, filePath }) {
  const journey = YAML.parse(fs.readFileSync(filePath, 'utf8'));
  let environment = false;
  for (let run = 0; run < PROOF_RUNS; run += 1) {
    const result = await runJourney({ context, item: { filePath, journey }, url });
    environment = environment || isEnvironmentFailure(result.failure);
    if (!failsWithFinding({ finding, journey, result })) {
      return environment ? 'environment' : 'not-reproduced';
    }
  }
  return null;
}

// Proves each finding of the run by a failing journey: the finding's
// candidate (compileWalks) runs twice, and the finding is proven only when
// both runs fail with it. Every other finding is not proven, with one
// reason: not-reproduced, environment (a $search stage the data set's store
// cannot run, in the walk or in a proof run), no-candidate (compilation
// produced none) or live-writes (a run on live connections proves nothing, so
// a proof never replays a write there). Proofs make no model calls and run
// after the walks, outside the budget. Returns { proven: [{ key, path }],
// notProven: [{ key, reason }], ms }.
async function proveFindings({ context, url, findings, candidates, live, now = Date.now }) {
  const started = now();
  const pathByKey = new Map(candidates.finding.map((entry) => [entry.key, entry.path]));
  const proven = [];
  const notProven = [];
  for (const finding of findings) {
    const filePath = pathByKey.get(finding.key);
    let reason = null;
    if (live) {
      reason = 'live-writes';
    } else if (finding.kind === 'environment') {
      reason = 'environment';
    } else if (type.isUndefined(filePath)) {
      reason = 'no-candidate';
    } else {
      reason = await proveCandidate({ context, url, finding, filePath });
    }
    if (reason === null) {
      proven.push({ key: finding.key, path: filePath });
    } else {
      notProven.push({ key: finding.key, reason });
    }
  }
  return { proven, notProven, ms: now() - started };
}

export default proveFindings;
