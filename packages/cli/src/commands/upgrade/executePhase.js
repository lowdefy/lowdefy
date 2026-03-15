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
import path from 'path';
import { execSync } from 'child_process';

import runScript from './runScript.js';
import handlePrompt from './handlePrompt.js';
import { askQuestion } from './handlePrompt.js';

function sortByCategory(codemods) {
  const order = { A: 0, B: 1, C: 2 };
  return [...codemods].sort((a, b) => (order[a.category] ?? 3) - (order[b.category] ?? 3));
}

function updateLowdefyVersion(configDirectory, version) {
  const yamlPath = path.join(configDirectory, 'lowdefy.yaml');
  if (!fs.existsSync(yamlPath)) return;

  let content = fs.readFileSync(yamlPath, 'utf8');
  // Match both quoted and unquoted version values
  content = content.replace(/^(lowdefy:\s*)(['"]?)[\d.]+(?:-[\w.]+)?(\2)\s*$/m, `$1$2${version}$3`);
  fs.writeFileSync(yamlPath, content);
}

function isGitRepo(directory) {
  try {
    execSync('git rev-parse --is-inside-work-tree', { cwd: directory, stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

async function executePhase({
  phase,
  targetDirectory,
  codemodsDirectory,
  apply,
  scriptsOnly,
  logger,
}) {
  logger.info(`\nPhase: Upgrading to v${phase.version} — ${phase.description}`);

  const sorted = sortByCategory(phase.codemods);
  const results = [];

  for (const codemod of sorted) {
    const label = `[${codemod.category}] ${codemod.description}`;

    if (codemod.category === 'C' && scriptsOnly) {
      logger.info(`  ${label} — skipped (--scripts-only)`);
      results.push({ id: codemod.id, status: 'skipped' });
      continue;
    }

    if (codemod.category === 'A' || codemod.category === 'B') {
      if (!codemod.script) {
        logger.warn(`  ${label} — no script defined, skipping.`);
        results.push({ id: codemod.id, status: 'skipped' });
        continue;
      }

      const scriptPath = path.join(codemodsDirectory, codemod.script);
      logger.info(`  ${label}`);
      const result = await runScript({ scriptPath, targetDirectory, apply });

      if (result.success) {
        logger.info(`    ✓ Done`);
      } else {
        logger.warn(`    ✗ Script failed`);
      }

      if (codemod.category === 'B' && apply) {
        const reportDir = path.join(targetDirectory, '.codemod-reports');
        const reportFile = path.join(reportDir, `${codemod.id}.md`);
        if (fs.existsSync(reportFile)) {
          logger.info(`    ⚠ Review report: ${reportFile}`);
          await askQuestion('    Review the report and press Enter to continue...');
        }
      }

      results.push({ id: codemod.id, status: result.success ? 'completed' : 'failed' });
      continue;
    }

    if (codemod.category === 'C') {
      logger.info(`  ${label}`);
      const promptPath = codemod.prompt ? path.join(codemodsDirectory, codemod.prompt) : null;
      const guidePath = codemod.guide ? path.join(codemodsDirectory, codemod.guide) : null;
      const result = await handlePrompt({
        promptPath,
        guidePath,
        codemodId: codemod.id,
        logger,
      });
      results.push({ id: codemod.id, status: result.status });
      continue;
    }

    logger.warn(`  ${label} — unknown category "${codemod.category}", skipping.`);
    results.push({ id: codemod.id, status: 'skipped' });
  }

  if (apply) {
    updateLowdefyVersion(targetDirectory, phase.version);
    logger.info(`\n  Updated lowdefy.yaml: lowdefy: '${phase.version}'`);

    if (isGitRepo(targetDirectory)) {
      const answer = await askQuestion(`  Commit this phase? [Y/n] `);
      if (answer === '' || answer.toLowerCase() === 'y') {
        try {
          execSync(`git add -A && git commit -m "chore: upgrade to lowdefy v${phase.version}"`, {
            cwd: targetDirectory,
            stdio: 'inherit',
          });
        } catch {
          logger.warn('  Git commit failed. You can commit manually.');
        }
      }
    }
  }

  logger.info(`  ✓ Phase complete.`);
  return { version: phase.version, status: 'completed', codemods: results };
}

export default executePhase;
