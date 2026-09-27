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
  Run the tenant auth journeys (apps/auth-reference-tenant/tests/journeys)
  end to end against this checkout, with nothing to install or run first.

  Usage:
    pnpm test:journeys:auth                      # build, then run every journey
    pnpm test:journeys:auth --skip-build         # reuse the current build
    pnpm test:journeys:auth --filter invitation  # only journeys whose name matches
    pnpm test:journeys:auth --port 3210          # first port to try (default 3200)

  How it works:
    1. Starts a single-node MongoDB replica set in memory (fresh every run) and
       provisions the auth indexes the reference app documents.
    2. Starts this checkout's dev server (scripts/dev.mjs) for the app with the
       database URI, an auth secret, a pinned origin, and the dev mail sink
       (LOWDEFY_DEV_SMTP_PORT) that the app's SMTP connection points at.
    3. Runs this checkout's `lowdefy test --url` against it.
    4. Stops everything and exits with the test run's exit code.

  Four consecutive free ports from --port are used: the app, the dev server's
  internal port, the mail sink and MongoDB. The dev server log is written to
  apps/auth-reference-tenant/.lowdefy/journeys-dev-server.log.
*/

import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { MongoMemoryReplSet } from 'mongodb-memory-server';

const REPO_ROOT = path.resolve(import.meta.dirname, '..');
const APP_DIRECTORY = path.join(REPO_ROOT, 'apps', 'auth-reference-tenant');
const LOG_PATH = path.join(APP_DIRECTORY, '.lowdefy', 'journeys-dev-server.log');
const BOOT_TIMEOUT_MS = 600000;

const { values: args } = parseArgs({
  options: {
    filter: { type: 'string' },
    port: { type: 'string', default: '3200' },
    'skip-build': { type: 'boolean', default: false },
  },
});

function run({ command, commandArgs, env, stdio = 'inherit' }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, { cwd: REPO_ROOT, env, stdio });
    child.on('error', reject);
    child.on('exit', (code, signal) => resolve(code ?? (signal ? 1 : 0)));
  });
}

async function findPorts({ start }) {
  // Built by `pnpm worktree` / `pnpm build`; the root cannot resolve the
  // workspace package by name, so it is imported from dist like scripts/dev.mjs.
  const { findAvailablePort } = await import('../packages/utils/node-utils/dist/index.js');
  const app = await findAvailablePort({ port: start });
  const internal = await findAvailablePort({ port: app + 1 });
  const smtp = await findAvailablePort({ port: internal + 1 });
  const mongo = await findAvailablePort({ port: smtp + 1 });
  return { app, internal, smtp, mongo };
}

async function startDatabase({ port }) {
  const replSet = await MongoMemoryReplSet.create({
    instanceOpts: [{ port, storageEngine: 'wiredTiger' }],
    replSet: { count: 1 },
  });
  const uri = replSet.getUri('auth-reference-tenant');
  const code = await run({
    command: process.execPath,
    commandArgs: ['apps/auth-reference/scripts/provision-indexes.mjs'],
    env: { ...process.env, AUTH_DATABASE_URI: uri },
  });
  if (code !== 0) {
    await replSet.stop();
    throw new Error('Could not provision the auth indexes.');
  }
  return { replSet, uri };
}

function startDevServer({ ports, uri }) {
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  const log = fs.openSync(LOG_PATH, 'w');
  const commandArgs = [
    'scripts/dev.mjs',
    '--config-directory',
    APP_DIRECTORY,
    '--port',
    String(ports.app),
  ];
  if (args['skip-build']) {
    commandArgs.push('--skip-build');
  }
  const child = spawn(process.execPath, commandArgs, {
    cwd: REPO_ROOT,
    // Its own process group, so stopping it also stops the manager and the
    // Vite child scripts/dev.mjs starts.
    detached: true,
    stdio: ['ignore', log, log],
    env: {
      ...process.env,
      BETTER_AUTH_URL: `http://localhost:${ports.app}`,
      LOWDEFY_DEV_SMTP_PORT: String(ports.smtp),
      LOWDEFY_SECRET_BETTER_AUTH_SECRET: crypto.randomBytes(32).toString('base64'),
      LOWDEFY_SECRET_SMTP_HOST: '127.0.0.1',
      LOWDEFY_SECRET_SMTP_PORT: String(ports.smtp),
      LOWDEFY_SECRET_TENANT_DATABASE_URI: uri,
      LOWDEFY_SERVER_DEV_INTERNAL_PORT: String(ports.internal),
      LOWDEFY_SERVER_DEV_STRICT_PORT: 'true',
    },
  });
  return child;
}

async function waitForServer({ child, url }) {
  const deadline = Date.now() + BOOT_TIMEOUT_MS;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) {
      throw new Error(`The dev server exited with code ${child.exitCode} before it was ready.`);
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
  throw new Error(`The dev server was not ready within ${BOOT_TIMEOUT_MS / 1000}s.`);
}

async function stopDevServer({ child }) {
  if (child.exitCode !== null || child.signalCode !== null) {
    return;
  }
  const exited = new Promise((resolve) => child.once('exit', resolve));
  process.kill(-child.pid, 'SIGTERM');
  await exited;
}

function printLogTail() {
  const lines = fs.readFileSync(LOG_PATH, 'utf8').trimEnd().split('\n');
  console.error(lines.slice(-40).join('\n'));
}

const ports = await findPorts({ start: Number(args.port) });
const url = `http://localhost:${ports.app}`;
console.log(`Starting MongoDB (memory replica set) on port ${ports.mongo}.`);
const { replSet, uri } = await startDatabase({ port: ports.mongo });
console.log(`Starting the dev server at ${url} (log: ${path.relative(REPO_ROOT, LOG_PATH)}).`);
const devServer = startDevServer({ ports, uri });

let exitCode = 1;
async function stopAll() {
  await stopDevServer({ child: devServer });
  await replSet.stop();
}
process.once('SIGINT', async () => {
  await stopAll();
  process.exit(130);
});

try {
  await waitForServer({ child: devServer, url });
  const testArgs = [
    'packages/cli/dist/index.js',
    'test',
    '--config-directory',
    APP_DIRECTORY,
    '--url',
    url,
    '--disable-telemetry',
  ];
  if (args.filter) {
    testArgs.push('--filter', args.filter);
  }
  exitCode = await run({ command: process.execPath, commandArgs: testArgs, env: process.env });
} catch (error) {
  console.error(error.message);
  printLogTail();
} finally {
  await stopAll();
}
process.exit(exitCode);
