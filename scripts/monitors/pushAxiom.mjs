#!/usr/bin/env node
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

/*
  Pushes build/monitors.json to Axiom as monitors, so every endpoint, page
  request and connection the app declares is watched without anyone hand-writing
  an alert per unit.

  Usage:
    AXIOM_TOKEN=... AXIOM_ORG_ID=... AXIOM_DATASET=... \
      node scripts/monitors/pushAxiom.mjs [build-directory] [--dry-run] [--app <slug>] \
        [--notifier <name>] [--allow-silent]
    pnpm monitors:push .lowdefy/build --dry-run

  Axiom, not Lowdefy, delivers the alert: a monitor fires and Axiom sends it to
  the notifiers attached to it. Name them with --notifier (repeatable) or
  AXIOM_NOTIFIERS, or attach them in Axiom and the push keeps them. A monitor
  that would end up with no notifier, or one whose notifier no longer exists,
  fails the push - a monitor nobody hears from looks exactly like a healthy one.
  Pass --allow-silent to push unrouted monitors anyway.

  The framework produces the payload; this script makes the call. Any sink that
  accepts the same wide events can consume the same artifact — add a renderer
  beside renderAxiomMonitor.mjs.
*/

import fs from 'node:fs';
import path from 'node:path';

import parsePushArgs from './parsePushArgs.mjs';
import syncMonitors from './syncMonitors.mjs';

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function resolveApp({ buildDirectory, app }) {
  if (app) return app;
  const appMetaPath = path.join(buildDirectory, 'appMeta.json');
  if (fs.existsSync(appMetaPath)) {
    const slug = readJson(appMetaPath).slug;
    if (slug) return slug;
  }
  return null;
}

async function run() {
  const {
    buildDirectory,
    dryRun,
    allowSilent,
    app: appArg,
    notifiers,
  } = parsePushArgs({ argv: process.argv.slice(2), env: process.env });
  const monitorsPath = path.join(buildDirectory, 'monitors.json');
  if (!fs.existsSync(monitorsPath)) {
    console.error(
      `No monitors.json in "${buildDirectory}". Run a full "lowdefy build" first — the artifact is written on every production build.`
    );
    process.exit(1);
  }
  const app = resolveApp({ buildDirectory, app: appArg });
  if (!app) {
    console.error('Could not resolve the app slug. Set `slug` in lowdefy.yaml or pass --app.');
    process.exit(1);
  }

  const token = process.env.AXIOM_TOKEN;
  const orgId = process.env.AXIOM_ORG_ID;
  const dataset = process.env.AXIOM_DATASET;
  if (!dataset) {
    console.error('AXIOM_DATASET is required.');
    process.exit(1);
  }
  if (!dryRun && (!token || !orgId)) {
    console.error('AXIOM_TOKEN and AXIOM_ORG_ID are required (or pass --dry-run).');
    process.exit(1);
  }

  const monitors = readJson(monitorsPath);
  const { results, skipped } = await syncMonitors({
    monitors,
    app,
    dataset,
    token,
    orgId,
    notifiers,
    allowSilent,
    dryRun,
  });
  console.log(
    `${dryRun ? 'Would push' : 'Pushed'} ${
      results.length
    } monitor(s) for "${app}" to dataset "${dataset}"${
      skipped.length > 0 ? `, skipped ${skipped.length}` : ''
    }.`
  );
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
