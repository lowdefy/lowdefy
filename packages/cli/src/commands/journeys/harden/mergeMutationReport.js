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

// A journey's score over the merged verdicts: the mutants it killed out of
// those it killed or survived, and `unique`, the ones only it killed. A
// journey this run measured can now share a kill with one an earlier run
// measured, and an earlier journey's mutants may since have gone, so neither
// run's own count holds.
function scoreJourney({ key, mutants }) {
  let killed = 0;
  let total = 0;
  let unique = 0;
  mutants.forEach(({ ranBy }) => {
    const own = ranBy.filter((verdict) => journeyKey(verdict) === key);
    if (own.some(({ verdict }) => verdict === 'killed')) {
      killed += 1;
      const killers = ranBy.filter(({ verdict }) => verdict === 'killed').map(journeyKey);
      if (killers.every((killer) => killer === key)) unique += 1;
    }
    if (own.some(({ verdict }) => verdict === 'killed' || verdict === 'survived')) {
      total += 1;
    }
  });
  return { killed, total, unique };
}

// Folds this run's mutation report into the one an earlier run wrote, so a
// run over some journeys keeps every other journey's score. This run's
// journeys replace their earlier entries and verdicts; an earlier journey this
// run did not measure keeps its entry and its mutants' verdicts while it still
// exists (`journeyKeys`: every journey's `file#name` now). A mutant this run
// did not list is kept only while it still exists (`currentIds`: the ids the
// dev server lists now, requestCurrentMutantIds), so removed or edited config
// stops counting in the score. A mutant's status, each journey's score and
// the suite's `killed` and `total` are recounted from the merged verdicts; the
// run fields (`generated`, `buildId`, `sampled`...) describe this run.
function mergeMutationReport({ previous, report, journeyKeys, currentIds }) {
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
    .filter(({ id }) => !listedThisRun.has(id) && currentIds.has(id))
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
      ...scoreJourney({ key: journeyKey(entry), mutants: merged }),
    }));
  const killed = merged.filter(({ status }) => status === 'killed').length;
  const survived = merged.filter(({ status }) => status === 'survived').length;
  return { ...report, killed, total: killed + survived, mutants: merged, journeys };
}

export default mergeMutationReport;
