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
import { type } from '@lowdefy/helpers';
import { readDevInstance } from '@lowdefy/node-utils';

import startDevServer from './startDevServer.js';

const STARTING_TIMEOUT_MS = 5 * 60 * 1000;
const POLL_INTERVAL_MS = 1000;
const PING_TIMEOUT_MS = 2000;

// The options that shape a server this run starts, and that a running one ignores. Only those
// given on the command line count: context.options always carries a port (3000 by default), and
// lowdefy.yaml's cli options apply to a hub server too.
const SERVER_OPTIONS = [
  ['refResolver', '--ref-resolver'],
  ['port', '--port'],
  ['devDirectory', '--dev-directory'],
  ['serverDirectory', '--server-directory'],
];

function trimTrailingSlash(url) {
  return url.replace(/\/+$/, '');
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function answersPing(url) {
  try {
    await axios.get(`${url}/api/ping`, { timeout: PING_TIMEOUT_MS });
    return true;
  } catch {
    return false;
  }
}

function warnIgnoredOptions({ context, url }) {
  const given = context.commandLineOptions ?? {};
  const ignored = SERVER_OPTIONS.filter(
    ([key]) => !type.isNone(given[key]) && given[key] !== ''
  ).map(([, flag]) => flag);
  if (ignored.length === 0) {
    return;
  }
  const named = ignored.length === 1 ? `${ignored[0]} does` : `${ignored.join(', ')} do`;
  context.logger.warn(
    `Using the running dev server at ${url}; ${named} not apply to it. Stop it to run with these options.`
  );
}

// A dev server in this worktree that is still starting (a `lowdefy hub start`
// answers before a long boot ends) is waited for rather than raced: a second
// one would be refused its .lowdefy/dev. A hub server can stay `starting`
// while it serves (LDF-535), so one whose url answers <basePath>/api/ping is
// ready too. Resolves the ready record, or null when the starting server is
// gone and this run should start its own.
async function waitForStartingServer({ context, pollIntervalMs, startingTimeoutMs, ping }) {
  const configDirectory = context.directories.config;
  context.logger.info('Waiting for the dev server in this worktree to finish starting.');
  const deadline = Date.now() + startingTimeoutMs;
  for (;;) {
    const record = readDevInstance({ configDirectory });
    if (record === null || record.state !== 'starting') {
      return record?.state === 'ready' ? record : null;
    }
    if (type.isString(record.url) && (await ping(record.url))) {
      return record;
    }
    if (Date.now() >= deadline) {
      const directory = path.relative(process.cwd(), configDirectory) || '.';
      throw new Error(
        `The dev server in this worktree did not become ready. See: lowdefy hub logs ${directory}`
      );
    }
    await sleep(pollIntervalMs);
  }
}

// The dev server `lowdefy test` and `lowdefy journeys harden` run against:
// --url, else the dev server already running for this app (waiting for one
// still starting), else a fresh headless one that stop() shuts down.
async function resolveServer({
  context,
  pollIntervalMs = POLL_INTERVAL_MS,
  startingTimeoutMs = STARTING_TIMEOUT_MS,
  ping = answersPing,
}) {
  if (type.isString(context.options.url) && context.options.url !== '') {
    context.logger.info(`Running tests against ${context.options.url}.`);
    return { url: trimTrailingSlash(context.options.url), stop: async () => {} };
  }
  // A dev server already running for this app owns .lowdefy/dev; starting a
  // second one there would be refused, so run against the running one.
  let running = readDevInstance({ configDirectory: context.directories.config });
  if (running?.state === 'starting') {
    running = await waitForStartingServer({ context, pollIntervalMs, startingTimeoutMs, ping });
  } else if (running?.state !== 'ready') {
    running = null;
  }
  if (running !== null) {
    context.logger.info(`Running tests against the running dev server at ${running.url}.`);
    warnIgnoredOptions({ context, url: running.url });
    return {
      url: running.url,
      // Shared with whoever started it, so its use is not this run's to measure.
      stop: async () => {
        context.logger.info('Resources: not measured (shared dev server).');
      },
    };
  }
  try {
    return await startDevServer({ context });
  } catch (error) {
    (error.serverOutput ?? []).forEach((line) => context.logger.error(line));
    throw error;
  }
}

export default resolveServer;
