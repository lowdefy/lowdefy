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
  Serves apps/journey-fixture from this checkout's dev server for the journey
  runner's real-Chromium tests (server-dev and cli `test:fixture`).

  - A fresh single-node MongoDB replica set in memory, from the shared
    binaries, for the app's fixture_db connection.
  - scripts/dev.mjs with --skip-build (run `pnpm build` first) in its own copy,
    _server/dev-journey-fixture, so a developer's `pnpm app:dev` copy in
    _server/dev is left alone.
  - CRON_SECRET, so detached CallApi steps dispatch.
  - The auth secret and API key the app's strategies-only auth reads.
  - A warm-up journey on every page: Vite compiles the client on its first
    page load and each page builds on its first visit, either of which can
    outlast or reset a test's journey. When the dev server can launch no
    Chromium, the server is stopped and { skipped } says why.

  Three free ports from `port` (default 3300): the app, the dev server's
  internal port and MongoDB. Never 3000. The dev server log is written to
  apps/journey-fixture/.lowdefy/fixture-dev-server.log.
*/

import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

import { MongoMemoryReplSet } from 'mongodb-memory-server';

const REPO_ROOT = path.resolve(import.meta.dirname, '../..');
const CONFIG_DIRECTORY = path.join(REPO_ROOT, 'apps', 'journey-fixture');
const LOG_PATH = path.join(CONFIG_DIRECTORY, '.lowdefy', 'fixture-dev-server.log');
const BOOT_TIMEOUT_MS = 600000;

async function findPorts({ start }) {
  // The root cannot resolve the workspace package by name, so it is imported
  // from dist like scripts/dev.mjs does.
  const { findAvailablePort } = await import('../../packages/utils/node-utils/dist/index.js');
  const app = await findAvailablePort({ port: start });
  const internal = await findAvailablePort({ port: app + 1 });
  const mongo = await findAvailablePort({ port: internal + 1 });
  return { app, internal, mongo };
}

function startDevServer({ ports, uri }) {
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  const log = fs.openSync(LOG_PATH, 'w');
  const child = spawn(
    process.execPath,
    [
      'scripts/dev.mjs',
      '--config-directory',
      CONFIG_DIRECTORY,
      '--port',
      String(ports.app),
      '--skip-build',
      '--dev-directory',
      '_server/dev-journey-fixture',
    ],
    {
      cwd: REPO_ROOT,
      // Its own process group, so stopping it also stops the manager and the
      // Vite child scripts/dev.mjs starts.
      detached: true,
      stdio: ['ignore', log, log],
      env: {
        ...process.env,
        CRON_SECRET: crypto.randomBytes(16).toString('hex'),
        LOWDEFY_SECRET_FIXTURE_API_KEY: crypto.randomBytes(16).toString('hex'),
        LOWDEFY_SECRET_FIXTURE_AUTH_SECRET: crypto.randomBytes(32).toString('hex'),
        LOWDEFY_SECRET_FIXTURE_DATABASE_URI: uri,
        LOWDEFY_SERVER_DEV_INTERNAL_PORT: String(ports.internal),
        LOWDEFY_SERVER_DEV_STRICT_PORT: 'true',
      },
    }
  );
  return child;
}

async function waitForServer({ child, url }) {
  const deadline = Date.now() + BOOT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(
        `The fixture dev server exited with code ${child.exitCode} before it was ready. See ${LOG_PATH}.`
      );
    }
    try {
      const response = await fetch(`${url}/api/ping`);
      if (response.ok) {
        return;
      }
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`The fixture dev server was not ready within ${BOOT_TIMEOUT_MS / 1000}s.`);
}

async function stopDevServer({ child }) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }
  const exited = new Promise((resolve) => child.once('exit', resolve));
  process.kill(-child.pid, 'SIGTERM');
  await exited;
}

async function postWarmUpJourney({ url, pageId, blockId }) {
  const response = await fetch(`${url}/lowdefy-docs/journey`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ pageId, user: 'none', steps: [{ expect: { visible: blockId } }] }),
  });
  return response.json();
}

// Returns null when every page warmed up, or the reason the journeys cannot
// run at all (no Chromium).
async function warmUp({ url }) {
  const pages = [
    { pageId: 'home', blockId: 'home_title' },
    { pageId: 'second', blockId: 'second_title' },
  ];
  for (const page of pages) {
    let result;
    for (let attempt = 0; attempt < 3 && result?.passed !== true; attempt += 1) {
      result = await postWarmUpJourney({ url, ...page });
      if (typeof result.error === 'string' && result.error.startsWith('No Chromium available')) {
        return result.error;
      }
    }
    if (result.passed !== true) {
      throw new Error(
        `The fixture page "${page.pageId}" did not warm up: ${JSON.stringify(result)}`
      );
    }
  }
  return null;
}

async function startJourneyFixture({ port = 3300 } = {}) {
  const ports = await findPorts({ start: port });
  const url = `http://localhost:${ports.app}`;
  const replSet = await MongoMemoryReplSet.create({
    // A loaded machine can take well over the 10 second default to start mongod.
    instanceOpts: [{ port: ports.mongo, storageEngine: 'wiredTiger', launchTimeout: 60000 }],
    replSet: { count: 1 },
  });
  const uri = replSet.getUri('journey_fixture');
  const child = startDevServer({ ports, uri });
  async function stop() {
    await stopDevServer({ child });
    await replSet.stop();
  }
  let skipped;
  try {
    await waitForServer({ child, url });
    skipped = await warmUp({ url });
  } catch (error) {
    await stop();
    throw error;
  }
  if (skipped !== null) {
    await stop();
    return { skipped };
  }
  return { url, uri, configDirectory: CONFIG_DIRECTORY, logPath: LOG_PATH, stop };
}

export { CONFIG_DIRECTORY };
export default startJourneyFixture;
