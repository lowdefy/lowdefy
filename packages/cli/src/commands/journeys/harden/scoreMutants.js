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

function mutantStatus({ verdicts, changed }) {
  if (changed) {
    return 'changed';
  }
  if (verdicts.length === 0) {
    return 'not run';
  }
  if (verdicts.some(({ verdict }) => verdict === 'killed')) {
    return 'killed';
  }
  if (verdicts.every(({ verdict }) => verdict === 'survived')) {
    return 'survived';
  }
  if (verdicts.every(({ verdict }) => verdict === 'unapplied')) {
    return 'unapplied';
  }
  return 'errored';
}

// Scores a harden run. A mutant is killed when a journey on its path killed
// it, survived when every journey on its path survived it, unapplied when
// every journey passed and none applied it, errored otherwise, changed when
// a config edit removed it during the run, and not run when the run stopped
// before it. A journey's score is the
// mutants it killed out of those on its path it killed or survived: errors
// and unapplied runs say nothing about its assertions. `unique` counts the
// mutants it killed and no other journey did. The suite's `killed` and
// `total` count mutants the same way.
function scoreMutants({ mutants, verdicts, baselines, changed = [] }) {
  const byMutant = new Map(mutants.map((mutant) => [mutant.id, []]));
  verdicts.forEach((verdict) => byMutant.get(verdict.mutantId)?.push(verdict));
  const scored = mutants.map((mutant) => {
    const ranBy = byMutant.get(mutant.id);
    return {
      ...mutant,
      ranBy,
      status: mutantStatus({ verdicts: ranBy, changed: changed.includes(mutant.id) }),
    };
  });
  const journeys = baselines.map(({ key, file, name }) => {
    const own = verdicts.filter((verdict) => verdict.journey === key);
    const killedIds = own
      .filter(({ verdict }) => verdict === 'killed')
      .map(({ mutantId }) => mutantId);
    const unique = killedIds.filter((mutantId) =>
      byMutant
        .get(mutantId)
        .every((verdict) => verdict.journey === key || verdict.verdict !== 'killed')
    ).length;
    return {
      key,
      file,
      name,
      killed: killedIds.length,
      total: own.filter(({ verdict }) => verdict === 'killed' || verdict === 'survived').length,
      unique,
    };
  });
  const killed = scored.filter(({ status }) => status === 'killed').length;
  const survived = scored.filter(({ status }) => status === 'survived').length;
  return { mutants: scored, journeys, killed, total: killed + survived };
}

export default scoreMutants;
