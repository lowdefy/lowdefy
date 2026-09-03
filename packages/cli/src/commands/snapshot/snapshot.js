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
import resolveTestServer from '../test/resolveTestServer.js';
import writeSnapshot from './writeSnapshot.js';

const USAGE =
  'Usage: lowdefy snapshot (--check | --update) [--pages a,b] [--users admin,member] [--pixel-tolerance 0.001] [--fail-on-pixel] [--url http://localhost:3000]. Exactly one of --check and --update is required.';

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

// Advisory drift (pixels, unless --fail-on-pixel) is printed with its diff.png
// but does not fail the run, so the exit code only ever means "the app renders
// different DOM or holds different state".
function logComparison({ context, comparison, target }) {
  const drifted = comparison.results.filter((result) => result.changed);
  const fatal = drifted.filter((result) => !result.advisory);
  const advisory = drifted.filter((result) => result.advisory);
  advisory.forEach((result) => {
    context.logger.warn(
      `ADVISORY ${target.pageId} as ${target.user}  ${comparison.label}/${result.artefact}`
    );
    result.lines.forEach((line) => context.logger.warn(`      ${line}`));
    context.logger.warn('      pixel drift does not fail --check; use --fail-on-pixel to make it.');
  });
  fatal.forEach((result) => {
    context.logger.error(
      `FAIL  ${target.pageId} as ${target.user}  ${comparison.label}/${result.artefact}`
    );
    result.lines.forEach((line) => context.logger.error(`      ${line}`));
  });
  if (fatal.length === 0) {
    context.logger.info(`PASS  ${target.pageId} as ${target.user}`);
  }
  return { fatal: fatal.length > 0, advisory: advisory.length > 0 };
}

// The paths a snapshot drops from its state: the page's own `~snapshotIgnore`
// (deprecated) plus the manifest entry's `ignore`, so a target can be made
// deterministic without editing the page it captures.
function ignorePathsFor({ captured, target }) {
  return [...(captured.snapshotIgnore ?? []), ...(target.ignore ?? [])];
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

  // Snapshots only read pages, so a development server already running for this
  // app is the right one to capture from; resolveTestServer boots one in
  // .lowdefy/test only when there is none.
  const server = await resolveTestServer({ context });
  let interrupted = false;
  async function onSigint() {
    interrupted = true;
    context.logger.warn('Interrupted. Stopping development server.');
    await server.stop();
    process.exit(130);
  }
  process.once('SIGINT', onSigint);

  let drifted = 0;
  let advised = 0;
  let written = 0;
  let failed = 0;
  let targets = [];
  // A target-resolution failure (broken manifest journey, unreachable app-map)
  // means nothing was captured — reported as its own failure, never folded
  // into the per-snapshot counts where it would corrupt the passed total.
  let fatal;
  try {
    targets = await resolveAllTargets({ context, manifest, url: server.url });
    if (targets.length === 0) {
      const filters = [];
      if (!type.isNone(context.options.pages)) {
        filters.push(`--pages "${context.options.pages}"`);
      }
      if (!type.isNone(context.options.users)) {
        filters.push(`--users "${context.options.users}"`);
      }
      if (filters.length > 0) {
        // A typo'd filter must not pass a CI --check with 0 snapshots.
        fatal = `No pages matched ${filters.join(' ')}.`;
      } else {
        context.logger.warn('No snapshots to take: no pages matched.');
      }
    }
    for (const target of targets) {
      // The whole capture-compare-write of one target is one unit of failure:
      // a corrupt golden or unreadable artefact fails THIS target and the run
      // continues to the next, instead of aborting the loop and counting the
      // unvisited targets as passed.
      try {
        const captured = await fetchSnapshot({ url: server.url, target });
        if (captured.ready === false) {
          context.logger.warn(`${target.pageId} as ${target.user}: ${captured.note}`);
        }
        const ignore = ignorePathsFor({ captured, target });
        if (update) {
          const paths = writeSnapshot({
            configDirectory: context.directories.config,
            target,
            snapshot: captured,
            ignore,
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
          ignore,
          failOnPixel: Boolean(context.options.failOnPixel),
        });
        const outcome = logComparison({ context, comparison, target });
        if (outcome.fatal) {
          drifted += 1;
        }
        if (outcome.advisory) {
          advised += 1;
        }
      } catch (error) {
        failed += 1;
        context.logger.error(`FAIL  ${target.pageId} as ${target.user}  ${error.message}`);
      }
    }
  } catch (error) {
    fatal = error.message;
  } finally {
    process.removeListener('SIGINT', onSigint);
    if (!interrupted) {
      await server.stop();
    }
  }

  if (fatal) {
    fail({ context, message: fatal });
    return;
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
  const summary = `${passed} passed, ${drifted} changed, ${failed} failed of ${
    targets.length
  } snapshots${advised > 0 ? `, ${advised} with advisory pixel drift` : ''}`;
  if (drifted > 0 || failed > 0) {
    fail({ context, message: summary });
    return;
  }
  context.logger.info(summary);
  context.sendTelemetry();
}

export { USAGE };
export default snapshot;
