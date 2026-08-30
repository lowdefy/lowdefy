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

import compareSnapshot from './compareSnapshot.js';
import fetchSnapshot, { fetchAppPageIds, fetchDevUsers } from './fetchSnapshot.js';
import readManifest from './readManifest.js';
import resolveTargets from './resolveTargets.js';
import startDevServer from '../test/startDevServer.js';
import writeSnapshot from './writeSnapshot.js';

const USAGE =
  'Usage: lowdefy snapshot (--check | --update) [--pages a,b] [--users admin,member] [--pixel-tolerance 0.001]. Exactly one of --check and --update is required.';

function parseTolerance(value) {
  if (type.isNone(value)) {
    return 0.001;
  }
  const tolerance = Number(value);
  if (!Number.isFinite(tolerance) || tolerance < 0 || tolerance > 1) {
    throw new Error(
      `--pixel-tolerance should be a fraction between 0 and 1. Received ${JSON.stringify(value)}.`
    );
  }
  return tolerance;
}

function fail({ context, message }) {
  context.logger.error(message);
  context.sendTelemetry();
  process.exitCode = 1;
}

// A manifest-less run needs the app's page list, and every run without
// explicit users needs the dev user names; both come from the running server.
async function resolveAllTargets({ context, manifest, url }) {
  const needsPages = type.isNone(manifest);
  const needsUsers =
    type.isNone(manifest) ||
    manifest.pages.some((entry) => !type.isArray(entry.users) || entry.users.length === 0);
  const appPageIds = needsPages ? await fetchAppPageIds({ url }) : [];
  const devUsers = needsUsers ? await fetchDevUsers({ url }) : [];
  return resolveTargets({
    manifest,
    appPageIds,
    devUsers,
    pagesFilter: context.options.pages,
    usersFilter: context.options.users,
    configDirectory: context.directories.config,
  });
}

function logComparison({ context, comparison, target }) {
  const drifted = comparison.results.filter((result) => result.changed);
  if (drifted.length === 0) {
    context.logger.info(`PASS  ${target.pageId} as ${target.user}`);
    return false;
  }
  drifted.forEach((result) => {
    context.logger.error(
      `FAIL  ${target.pageId} as ${target.user}  ${comparison.label}/${result.artefact}`
    );
    result.lines.forEach((line) => context.logger.error(`      ${line}`));
  });
  return true;
}

async function snapshot({ context }) {
  const { check, update } = context.options;
  if (Boolean(check) === Boolean(update)) {
    fail({ context, message: USAGE });
    return;
  }
  let pixelTolerance;
  let manifest;
  try {
    pixelTolerance = parseTolerance(context.options.pixelTolerance);
    manifest = readManifest({ configDirectory: context.directories.config });
  } catch (error) {
    fail({ context, message: error.message });
    return;
  }

  let server;
  try {
    server = await startDevServer({ context });
  } catch (error) {
    (error.serverOutput ?? []).forEach((line) => context.logger.error(line));
    throw error;
  }
  let interrupted = false;
  async function onSigint() {
    interrupted = true;
    context.logger.warn('Interrupted. Stopping development server.');
    await server.stop();
    process.exit(130);
  }
  process.once('SIGINT', onSigint);

  let drifted = 0;
  let written = 0;
  let failed = 0;
  let targets = [];
  try {
    targets = await resolveAllTargets({ context, manifest, url: server.url });
    if (targets.length === 0) {
      context.logger.warn('No snapshots to take: no pages matched.');
    }
    for (const target of targets) {
      let captured;
      try {
        captured = await fetchSnapshot({ url: server.url, target });
      } catch (error) {
        failed += 1;
        context.logger.error(`FAIL  ${target.pageId} as ${target.user}  ${error.message}`);
        continue;
      }
      if (captured.ready === false) {
        context.logger.warn(`${target.pageId} as ${target.user}: ${captured.note}`);
      }
      if (update) {
        const paths = writeSnapshot({
          configDirectory: context.directories.config,
          target,
          snapshot: captured,
        });
        written += 1;
        context.logger.info(`WROTE ${paths.label}`);
        continue;
      }
      const comparison = compareSnapshot({
        configDirectory: context.directories.config,
        target,
        snapshot: captured,
        pixelTolerance,
      });
      if (logComparison({ context, comparison, target })) {
        drifted += 1;
      }
    }
  } catch (error) {
    failed += 1;
    context.logger.error(error.message);
  } finally {
    process.removeListener('SIGINT', onSigint);
    if (!interrupted) {
      await server.stop();
    }
  }

  if (update) {
    const summary = `${written} snapshots written${failed > 0 ? `, ${failed} failed` : ''}`;
    if (failed > 0) {
      fail({ context, message: summary });
      return;
    }
    context.logger.info(summary);
    context.sendTelemetry();
    return;
  }
  const passed = targets.length - drifted - failed;
  const summary = `${passed} passed, ${drifted} changed, ${failed} failed of ${targets.length} snapshots`;
  if (drifted > 0 || failed > 0) {
    fail({ context, message: summary });
    return;
  }
  context.logger.info(summary);
  context.sendTelemetry();
}

export { USAGE };
export default snapshot;
