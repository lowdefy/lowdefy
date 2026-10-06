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

import mutantStatus from './mutantStatus.js';

function journeyKey({ file, name }) {
  return `${file}#${name}`;
}

// The mutants only this journey killed, over the merged verdicts: a journey
// this run measured can now share a kill with one an earlier run measured, so
// neither run's own count holds.
function countUnique({ key, mutants }) {
  return mutants.filter(({ ranBy }) => {
    const killers = ranBy.filter(({ verdict }) => verdict === 'killed').map(journeyKey);
    return killers.includes(key) && killers.every((killer) => killer === key);
  }).length;
}

// Folds this run's mutation report into the one an earlier run wrote, so a
// run over some journeys keeps every other journey's score. This run's
// journeys replace their earlier entries and verdicts; an earlier journey this
// run did not measure keeps its entry and its mutants' verdicts while it still
// exists (`journeyKeys`: every journey's `file#name` now). A mutant's status,
// each journey's `unique` and the suite's `killed` and `total` are recounted
// from the merged verdicts; the run fields (`generated`, `buildId`, `sampled`...) describe
// this run.
function mergeMutationReport({ previous, report, journeyKeys }) {
  const ranThisRun = new Set(report.journeys.map(journeyKey));
  function keep(entry) {
    const key = journeyKey(entry);
    return !ranThisRun.has(key) && journeyKeys.has(key);
  }
  const previousMutants = new Map(previous.mutants.map((mutant) => [mutant.id, mutant]));
  const merged = report.mutants.map((mutant) => {
    const earlier = (previousMutants.get(mutant.id)?.ranBy ?? []).filter(keep);
    const ranBy = [...earlier, ...mutant.ranBy];
    return {
      ...mutant,
      ranBy,
      status: mutantStatus({ verdicts: ranBy, changed: mutant.status === 'changed' }),
    };
  });
  const listedThisRun = new Set(report.mutants.map(({ id }) => id));
  previous.mutants
    .filter(({ id }) => !listedThisRun.has(id))
    .forEach((mutant) => {
      const ranBy = mutant.ranBy.filter(keep);
      if (ranBy.length === 0) {
        return;
      }
      merged.push({ ...mutant, ranBy, status: mutantStatus({ verdicts: ranBy, changed: false }) });
    });
  const journeys = [...previous.journeys.filter(keep), ...report.journeys]
    .sort((a, b) => journeyKey(a).localeCompare(journeyKey(b)))
    .map((entry) => ({
      ...entry,
      unique: countUnique({ key: journeyKey(entry), mutants: merged }),
    }));
  const killed = merged.filter(({ status }) => status === 'killed').length;
  const survived = merged.filter(({ status }) => status === 'survived').length;
  return { ...report, killed, total: killed + survived, mutants: merged, journeys };
}

export default mergeMutationReport;
