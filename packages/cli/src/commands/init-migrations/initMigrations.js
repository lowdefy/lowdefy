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
import path from 'node:path';
import url from 'node:url';

import { getMigrationLedgerPath, readFile } from '@lowdefy/node-utils';

import ensureGitignore from './ensureGitignore.js';
import getStageBranch from './getStageBranch.js';
import parseStages from './parseStages.js';
import writeFileIfMissing from './writeFileIfMissing.js';

function renderTemplate({ template, stage, cliVersion }) {
  return template
    .replaceAll('__STAGE__', stage)
    .replaceAll('__BRANCH__', getStageBranch({ stage }))
    .replaceAll('__LOWDEFY_VERSION__', cliVersion);
}

// Sets a project up to run its migrations per environment in CI (design D16):
// one dry-run workflow (pull requests → plan as a PR comment) and one run
// workflow (push → apply, commit the ledger) per stage, an empty ledger per
// stage, and the .gitignore exception that lets the ledgers be committed.
// Modelled on the pipelines the production Lowdefy apps converged on, so the
// concurrency group, environment secrets and if: always() ledger commit are
// in place from the start instead of rediscovered.
async function initMigrations({ context }) {
  context.logger.info('Initializing migration workflows.');
  const configDirectory = context.directories.config;
  const stages = parseStages({ stages: context.options.stages });

  const dryRunTemplate = await readFile(
    url.fileURLToPath(new URL('./templates/migrations-dry-run.yml', import.meta.url))
  );
  const runTemplate = await readFile(
    url.fileURLToPath(new URL('./templates/migrations-run.yml', import.meta.url))
  );

  for (const stage of stages) {
    const workflowsDirectory = path.join(configDirectory, '.github', 'workflows');
    await writeFileIfMissing({
      context,
      filePath: path.join(workflowsDirectory, `migrations-dry-run-${stage}.yml`),
      content: renderTemplate({ template: dryRunTemplate, stage, cliVersion: context.cliVersion }),
      label: `.github/workflows/migrations-dry-run-${stage}.yml`,
    });
    await writeFileIfMissing({
      context,
      filePath: path.join(workflowsDirectory, `migrations-run-${stage}.yml`),
      content: renderTemplate({ template: runTemplate, stage, cliVersion: context.cliVersion }),
      label: `.github/workflows/migrations-run-${stage}.yml`,
    });
    await writeFileIfMissing({
      context,
      filePath: getMigrationLedgerPath({ configDirectory, stage }),
      content: `${JSON.stringify({ stage, applied: [] }, null, 2)}\n`,
      label: `.lowdefy/migrations/${stage}.json`,
    });
  }

  await ensureGitignore({ context, configDirectory });

  context.logger.info(
    `Create a GitHub environment per stage (${stages.join(
      ', '
    )}) holding the connection secrets, then commit the generated files. Chain your deploy job after the migrate job — see the comment in migrations-run-<stage>.yml.`
  );
  await context.sendTelemetry();
  context.logger.info({ spin: 'succeed' }, 'Migration workflows initialized.');
}

export default initMigrations;
