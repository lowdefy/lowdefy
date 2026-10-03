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

import exercisedArtifacts from './exercisedArtifacts.js';

function unchangedFor({ journey, oldEnumeration, newEnumeration, oldBaselines, newBaselines }) {
  const oldBaseline = oldBaselines.find(({ key }) => key === journey);
  const newBaseline = newBaselines.find(({ key }) => key === journey);
  if (type.isUndefined(oldBaseline) || type.isUndefined(newBaseline)) {
    return false;
  }
  const artifacts = new Set([
    ...exercisedArtifacts(oldBaseline.exercised),
    ...exercisedArtifacts(newBaseline.exercised),
  ]);
  return [...artifacts].every((artifact) => {
    const before = oldEnumeration.artifacts[artifact];
    return !type.isUndefined(before) && before === newEnumeration.artifacts[artifact];
  });
}

// After a config edit mid-run, which (mutant, journey) verdicts still stand.
// A verdict is kept when its mutant's id is still listed and every artifact
// the journey's old and new baselines exercised has the same content hash:
// nothing the run read changed. Every other verdict of a listed mutant is
// requeued, to run again against the new build's keys; a mutant whose id is
// gone changed during the run.
function carryOverVerdicts({
  verdicts,
  oldEnumeration,
  newEnumeration,
  oldBaselines,
  newBaselines,
}) {
  const listed = new Set(newEnumeration.mutants.map(({ id }) => id));
  const unchanged = new Map();
  const kept = [];
  const requeue = [];
  const gone = new Set();
  verdicts.forEach((verdict) => {
    if (!listed.has(verdict.mutantId)) {
      gone.add(verdict.mutantId);
      return;
    }
    if (!unchanged.has(verdict.journey)) {
      unchanged.set(
        verdict.journey,
        unchangedFor({
          journey: verdict.journey,
          oldEnumeration,
          newEnumeration,
          oldBaselines,
          newBaselines,
        })
      );
    }
    if (unchanged.get(verdict.journey)) {
      kept.push(verdict);
    } else {
      requeue.push({ mutantId: verdict.mutantId, journey: verdict.journey });
    }
  });
  return { kept, requeue, gone: [...gone] };
}

export default carryOverVerdicts;
