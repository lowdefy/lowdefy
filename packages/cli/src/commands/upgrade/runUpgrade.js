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

import { readUpgradeState, writeUpgradeState, clearUpgradeState } from './upgradeState.js';
import executePhase from './executePhase.js';

async function runUpgrade({
  chain,
  targetDirectory,
  codemodsDirectory,
  apply,
  logger,
  resume,
  scriptsOnly,
}) {
  let phases;

  if (resume) {
    const state = readUpgradeState(targetDirectory);
    if (!state) {
      logger.warn('No upgrade state found. Starting fresh.');
      phases = chain;
    } else {
      const completedVersions = new Set(
        state.phases.filter((p) => p.status === 'completed').map((p) => p.version)
      );
      phases = chain.filter((entry) => !completedVersions.has(entry.version));
      if (phases.length === 0) {
        logger.info('All phases already completed.');
        clearUpgradeState(targetDirectory);
        return;
      }
      logger.info(`Resuming upgrade — ${phases.length} phase(s) remaining.`);
    }
  } else {
    phases = chain;
  }

  // Write initial state
  const state = {
    startedAt: new Date().toISOString(),
    fromVersion: chain[0]?.version ?? 'unknown',
    toVersion: chain[chain.length - 1]?.version ?? 'unknown',
    currentPhase: 0,
    phases: chain.map((entry) => ({
      version: entry.version,
      status: 'pending',
      codemods: entry.codemods.map((c) => ({ id: c.id, status: 'pending' })),
    })),
  };
  writeUpgradeState(targetDirectory, state);

  let totalFiles = 0;
  let skippedCount = 0;

  for (let i = 0; i < phases.length; i++) {
    const phase = phases[i];

    // Update state to in-progress
    const statePhase = state.phases.find((p) => p.version === phase.version);
    if (statePhase) statePhase.status = 'in-progress';
    state.currentPhase = i;
    writeUpgradeState(targetDirectory, state);

    const result = await executePhase({
      phase,
      targetDirectory,
      codemodsDirectory,
      apply,
      scriptsOnly,
      logger,
    });

    // Update state to completed
    if (statePhase) {
      statePhase.status = 'completed';
      statePhase.codemods = result.codemods;
    }
    writeUpgradeState(targetDirectory, state);

    skippedCount += result.codemods.filter((c) => c.status === 'skipped').length;
  }

  if (skippedCount > 0) {
    logger.info(
      `\n⚠ ${skippedCount} codemod(s) were skipped. Run "npx lowdefy upgrade --resume" to complete them.`
    );
  } else {
    clearUpgradeState(targetDirectory);
  }

  const targetVersion = chain[chain.length - 1]?.version ?? 'unknown';
  logger.info(`\n✓ Upgrade complete! Your app is now on Lowdefy ${targetVersion}.`);
  logger.info(`\n  Next steps:`);
  logger.info(`  - Review changes: git diff`);
  logger.info(`  - Run your app: lowdefy dev`);
  logger.info(`  - Run your tests`);
}

export default runUpgrade;
