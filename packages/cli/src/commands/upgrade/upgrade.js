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

import path from 'path';
import axios from 'axios';
import semver from 'semver';

import getCodemods from './getCodemods.js';
import resolveChain from './resolveChain.js';
import runUpgrade from './runUpgrade.js';
import { readUpgradeState } from './upgradeState.js';
import { askQuestion } from './handlePrompt.js';

async function upgrade({ context }) {
  const currentVersion = context.lowdefyVersion;
  const logger = context.logger;
  const configDirectory = context.directories.config;
  const codemodsDir = path.join(configDirectory, '.lowdefy', 'codemods');

  if (!semver.valid(currentVersion)) {
    throw new Error(`Current version "${currentVersion}" is not a valid semver version.`);
  }

  logger.info(`Current version: ${currentVersion} (from lowdefy.yaml)`);

  // Determine target version
  let targetVersion = context.options.to;
  if (!targetVersion) {
    logger.info({ spin: 'start' }, 'Checking latest Lowdefy version...');
    try {
      const packageInfo = await axios.get('https://registry.npmjs.org/lowdefy');
      targetVersion = packageInfo.data['dist-tags'].latest;
    } catch {
      throw new Error('Could not reach npm registry to determine latest version.');
    }
    logger.info(`Latest stable version: ${targetVersion}`);
  }

  if (!semver.valid(targetVersion)) {
    throw new Error(`Target version "${targetVersion}" is not a valid semver version.`);
  }

  if (semver.gte(currentVersion, targetVersion)) {
    logger.info(`Already up to date (${currentVersion}).`);
    return;
  }

  logger.info(`\nUpgrade path: ${currentVersion} → ${targetVersion}\n`);

  // Fetch codemods package
  const { registry, directory: codemodsDirectory } = await getCodemods({
    directory: codemodsDir,
    logger,
  });

  // Resolve chain
  const chain = resolveChain({ registry, currentVersion, targetVersion });

  if (chain.length === 0) {
    logger.info('No codemods needed for this upgrade. Update lowdefy.yaml manually.');
    return;
  }

  // Handle resume
  const resume = context.options.resume;
  if (resume) {
    const state = readUpgradeState(configDirectory);
    if (!state) {
      logger.warn('No upgrade in progress. Starting fresh.');
    }
  }

  // Print plan
  chain.forEach((phase, i) => {
    const codemodCount = phase.codemods.length;
    logger.info(`  Phase ${i + 1}: v${phase.version} — ${codemodCount} codemod(s)`);
    phase.codemods.forEach((c) => {
      const icon = c.category === 'A' ? '✓' : c.category === 'B' ? '⚡' : '◇';
      logger.info(`    ${icon} ${c.description} (${c.category})`);
    });
    logger.info('');
  });

  if (context.options.plan) {
    return;
  }

  // Confirm
  const dryRun = context.options.dryRun;
  if (!dryRun) {
    const answer = await askQuestion('Proceed? [Y/n] ');
    if (answer && answer.toLowerCase() !== 'y') {
      logger.info('Upgrade cancelled.');
      return;
    }
  }

  // Execute
  await runUpgrade({
    chain,
    targetDirectory: configDirectory,
    codemodsDirectory,
    apply: !dryRun,
    logger,
    resume,
    scriptsOnly: context.options.scriptsOnly,
  });

  // Telemetry
  if (context.sendTelemetry) {
    await context.sendTelemetry({
      data: { upgrade: { from: currentVersion, to: targetVersion, phases: chain.length } },
    });
  }
}

export default upgrade;
