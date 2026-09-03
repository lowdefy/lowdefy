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
import { runMigrations } from '@lowdefy/api';
import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import { publish } from './devEventBus.js';
import isWriteRequestsAllowed from './isWriteRequestsAllowed.js';
import readBuildArtifact from './readBuildArtifact.js';

// Runs the app's migrations against the dev database the way
// `lowdefy migrate` does, in this process: the dev server directory has the
// connection plugins installed and the dev build wrote the migration
// artifacts, so the same runner applies. The stage is the one the dev build
// was made for (STAGE, else local), so the run and the build index agree and
// the ledger file it rewrites is the one the next build reads. A dry run only
// plans; applying rewrites the developer's real database and the ledger, so
// it is refused unless the app opts in (cli.agentTools.allowWriteRequests),
// the same gate lowdefy_run_endpoint and lowdefy_seed_fixture use. Refusals
// and migration failures come back as data, never as a tool failure.
async function runMigrate({ dryRun = false, to, allowChecksumMismatch = false } = {}) {
  if (!type.isNone(to) && !type.isString(to)) {
    throw new ConfigError(
      `migrate "to" must be a migration id string. Received ${JSON.stringify(to)}.`
    );
  }
  const index = readBuildArtifact({ name: 'migrations.json' });
  if (index === null || Array.isArray(index) || !Array.isArray(index.migrations)) {
    return {
      refused: true,
      reason:
        'No migrations index in the dev build yet. Wait for the build to complete (lowdefy_build_status), then retry.',
    };
  }
  if (index.migrations.length === 0) {
    return {
      stage: index.stage,
      dryRun,
      pending: [],
      applied: [],
      failed: null,
      note: 'The app has no migrations.',
    };
  }
  if (!dryRun) {
    const allowed = await isWriteRequestsAllowed();
    if (!allowed) {
      return {
        refused: true,
        reason:
          'Applying migrations writes to the dev database and rewrites the stage ledger. Set cli.agentTools.allowWriteRequests: true in lowdefy.yaml to allow it, or pass dryRun: true to plan only.',
      };
    }
  }
  // Deferred import: createSystemContext statically imports build/plugins/*
  // artifacts, which only exist in a running server directory - importing it
  // at module load would break every consumer of this module (e.g. the MCP
  // server) in environments without a full build.
  const { default: createSystemContext } = await import('../server/auth/createSystemContext.js');
  const { default: applyConnectionOverrides } = await import(
    '../server/applyConnectionOverrides.js'
  );
  const context = createSystemContext();
  // `lowdefy test` points every seeded connection at its in-memory database
  // through LOWDEFY_TEST_CONNECTION_OVERRIDES; migrations must follow.
  applyConnectionOverrides({ context });
  try {
    const report = await runMigrations(context, {
      options: {
        stage: index.stage,
        dryRun,
        to: type.isNone(to) || to === '' ? undefined : to,
        allowChecksumMismatch,
        runner: 'lowdefy-dev-mcp',
      },
    });
    if (!dryRun && (report.applied.length > 0 || report.failed !== null)) {
      publish({
        type: 'migrations',
        stage: report.stage,
        applied: report.applied.map((entry) => entry.id),
        failed: report.failed,
      });
    }
    return report;
  } catch (error) {
    // A refusal (checksum mismatch, stage/build disagreement, unknown --to) is
    // an expected outcome an agent should read and act on.
    if (error instanceof ConfigError) {
      return { refused: true, reason: error.message };
    }
    throw error;
  }
}

export default runMigrate;
