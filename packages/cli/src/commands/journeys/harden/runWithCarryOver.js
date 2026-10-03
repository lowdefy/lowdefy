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

import carryOverVerdicts from './carryOverVerdicts.js';
import requestMutants from './requestMutants.js';
import runBaseline from './runBaseline.js';
import runMutantPair from './runMutantPair.js';
import runMutantWorkers from './runMutantWorkers.js';
import waitForOkBuild from './waitForOkBuild.js';

function toPairs({ mutants, baselines }) {
  const byKey = new Map(baselines.map((baseline) => [baseline.key, baseline]));
  return mutants.flatMap((mutant) =>
    mutant.journeys.map((key) => ({ mutant, baseline: byKey.get(key) }))
  );
}

const MAX_REBUILDS = 3;

// Runs the pairs, and when the config changes mid-run (every page save on
// the dev server is a new build) waits for an ok build, re-runs the
// baselines, lists the mutants again and keeps the verdicts no changed
// artifact touched; the rest run again against the new build's keys. The
// third change stops the run, keeping what it has.
async function runWithCarryOver({ context, options, items, url, baselines, listing, mutants }) {
  let current = { baselines, listing, mutants };
  let pairs = toPairs({ mutants, baselines });
  let verdicts = [];
  const changed = new Set();
  let rebuilds = 0;
  for (;;) {
    const buildId = current.listing.buildId;
    const run = await runMutantWorkers({
      pairs,
      workers: options.workers,
      runPair: (pair) => runMutantPair({ pair, url, buildId }),
      onVerdict: (verdict) =>
        context.logger.debug(`${verdict.verdict} ${verdict.mutantId} ${verdict.journey}`),
    });
    verdicts = [...verdicts, ...run.verdicts];
    if (!run.buildChanged) {
      return { ...current, buildId, verdicts, changed: [...changed], rebuilds, stopped: false };
    }
    rebuilds += 1;
    if (rebuilds >= MAX_REBUILDS) {
      context.logger.error(
        'The config changed three times during the run. Rerun `lowdefy journeys harden` when it settles.'
      );
      return { ...current, buildId, verdicts, changed: [...changed], rebuilds, stopped: true };
    }
    context.logger.info('The config changed during the run. Carrying the verdicts over.');
    await waitForOkBuild({ url });
    const rerun = await runBaseline({
      items: items.filter((item) => current.baselines.some((baseline) => baseline.item === item)),
      url,
      configDirectory: context.directories.config,
    });
    rerun.failed.forEach(({ name }) =>
      context.logger.warn(`Left out "${name}": its baseline fails after the config change.`)
    );
    const newListing = await requestMutants({
      url,
      baselines: rerun.baselines,
      operators: options.operators,
    });
    const carried = carryOverVerdicts({
      verdicts,
      oldEnumeration: current.listing,
      newEnumeration: newListing,
      oldBaselines: current.baselines,
      newBaselines: rerun.baselines,
    });
    carried.gone.forEach((id) => changed.add(id));
    const byId = new Map(newListing.mutants.map((mutant) => [mutant.id, mutant]));
    const newMutants = current.mutants
      .filter(({ id }) => byId.has(id))
      .map((mutant) => ({ ...byId.get(mutant.id), journeys: mutant.journeys }));
    current.mutants.filter(({ id }) => !byId.has(id)).forEach(({ id }) => changed.add(id));
    const newBaselines = new Map(rerun.baselines.map((baseline) => [baseline.key, baseline]));
    const newMutantsById = new Map(newMutants.map((mutant) => [mutant.id, mutant]));
    const queued = [
      ...carried.requeue,
      ...run.pending.map((pair) => ({ mutantId: pair.mutant.id, journey: pair.baseline.key })),
    ];
    pairs = queued
      .filter(({ mutantId, journey }) => newMutantsById.has(mutantId) && newBaselines.has(journey))
      .map(({ mutantId, journey }) => ({
        mutant: newMutantsById.get(mutantId),
        baseline: newBaselines.get(journey),
      }));
    verdicts = carried.kept;
    current = {
      baselines: current.baselines.map((baseline) => newBaselines.get(baseline.key) ?? baseline),
      listing: newListing,
      mutants: [...newMutants, ...current.mutants.filter(({ id }) => !byId.has(id))],
    };
  }
}

export default runWithCarryOver;
