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
import { spawn } from 'child_process';
import { type, wait } from '@lowdefy/helpers';
import { getProcessStartTime, readDevInstance } from '@lowdefy/node-utils';

import allocatePorts from './allocatePorts.js';
import hasLowdefyYaml from '../../utils/hasLowdefyYaml.js';
import fetchOpenTabs from './fetchOpenTabs.js';
import {
  HUB_PROTOCOL,
  IDLE_STOP_MS,
  MAX_LOG_LINES,
  PORT_RANGE,
  READY_TIMEOUT_MS,
} from './hubProtocol.js';
import readLogTail from './readLogTail.js';
import resolveDevCommand from './resolveDevCommand.js';
import stopProcessGroup from './stopProcessGroup.js';

function isGroupAlive(pid) {
  try {
    process.kill(process.platform === 'win32' ? pid : -pid, 0);
    return true;
  } catch (error) {
    return error.code === 'EPERM';
  }
}

// The registry outlives processes (and reboots), so an entry counts only while
// its process group lives and its leader is the same process the hub started.
function isManagedAlive(managed) {
  if (!isGroupAlive(managed.pid)) {
    return false;
  }
  if (process.platform === 'win32') {
    return true;
  }
  return getProcessStartTime({ pid: managed.pid }) === managed.processStartTime;
}

function loadRegistry({ registryPath }) {
  try {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    return { ports: registry.ports ?? {}, instances: registry.instances ?? {} };
  } catch {
    return { ports: {}, instances: {} };
  }
}

function realDirectory(configDirectory) {
  try {
    return fs.realpathSync(configDirectory);
  } catch {
    throw new Error(`App directory ${configDirectory} does not exist.`);
  }
}

// The hub owns the dev servers it starts and nothing else. It keeps a small
// registry (the process group of each managed server and the ports each app
// last used) on disk, so a replacement hub - after a crash or an upgrade -
// adopts the servers still running instead of orphaning them.
//
// Discovery never goes through the hub: every reader finds a running server
// through the app's own .lowdefy/instance.json. The hub is needed only to
// start, stop and read the logs of the servers it runs.
function createHub({
  paths,
  cliVersion,
  logger,
  openTabs = fetchOpenTabs,
  portRange = PORT_RANGE,
}) {
  const registry = loadRegistry(paths);
  const exits = new Map();
  const attachments = new Map();
  const lastDetachedAt = new Map();
  let queue = Promise.resolve();

  // Starting and stopping read the registry, then act on it across awaits. Two
  // sessions asking for one app at once (or one agent's parallel tool calls)
  // would both see it stopped and launch two servers, the loser orphaned; two
  // apps starting at once would both be handed the same free port pair. So
  // these run one at a time. Waiting for ready does not.
  function serialize(task) {
    const result = queue.then(task);
    queue = result.catch(() => {});
    return result;
  }

  function saveRegistry() {
    fs.mkdirSync(path.dirname(paths.registryPath), { recursive: true });
    fs.writeFileSync(paths.registryPath, `${JSON.stringify(registry, null, 2)}\n`);
  }

  function forgetDeadServers() {
    Object.entries(registry.instances).forEach(([configDirectory, managed]) => {
      if (!isManagedAlive(managed)) {
        delete registry.instances[configDirectory];
      }
    });
    saveRegistry();
  }

  function describe(configDirectory) {
    const record = readDevInstance({ configDirectory });
    const managed = registry.instances[configDirectory];
    if (record !== null) {
      return {
        configDirectory,
        owner: record.owner,
        state: record.state,
        url: record.url,
        pid: record.pid,
        startedAt: record.startedAt,
        managed: record.owner === 'hub' && !type.isUndefined(managed),
        command: managed?.command,
      };
    }
    if (!type.isUndefined(managed) && isManagedAlive(managed)) {
      return {
        configDirectory,
        owner: 'hub',
        state: 'starting',
        pid: managed.pid,
        startedAt: managed.startedAt,
        managed: true,
        command: managed.command,
      };
    }
    const exit = exits.get(configDirectory);
    if (!type.isUndefined(exit)) {
      return { configDirectory, state: 'exited', managed: false, exit };
    }
    return { configDirectory, state: 'stopped', managed: false };
  }

  function logPathFor(configDirectory) {
    return path.join(configDirectory, '.lowdefy', 'dev.log');
  }

  async function waitForReady(configDirectory) {
    const deadline = Date.now() + READY_TIMEOUT_MS;
    while (Date.now() < deadline) {
      const status = describe(configDirectory);
      if (status.state === 'ready') {
        return status;
      }
      if (status.state === 'exited') {
        return {
          ...status,
          logTail: readLogTail({ logPath: logPathFor(configDirectory), lines: 30 }),
        };
      }
      await wait(250);
    }
    return {
      ...describe(configDirectory),
      logTail: readLogTail({ logPath: logPathFor(configDirectory), lines: 10 }),
      note: `Not ready after ${
        READY_TIMEOUT_MS / 1000
      }s - it may still be installing or building. Call again to keep waiting.`,
    };
  }

  async function stopServer({ configDirectory }) {
    const managed = registry.instances[configDirectory];
    if (type.isUndefined(managed)) {
      const record = readDevInstance({ configDirectory });
      if (record !== null) {
        return {
          stopped: false,
          reason: `This dev server was not started by the hub (owner ${record.owner}, pid ${record.pid}). Ask the user to stop it.`,
        };
      }
      return { stopped: false, reason: 'No dev server is running for this app.' };
    }
    if (isManagedAlive(managed)) {
      await stopProcessGroup({ pid: managed.pid });
    }
    delete registry.instances[configDirectory];
    saveRegistry();
    logger.info(`Stopped ${configDirectory}.`);
    return { stopped: true };
  }

  async function launch({ configDirectory, env }) {
    const devCommand = await resolveDevCommand({ configDirectory });
    const reserved = Object.entries(registry.ports)
      .filter(([directory]) => directory !== configDirectory)
      .map(([, pair]) => pair);
    const ports = await allocatePorts({
      previous: registry.ports[configDirectory],
      reserved,
      range: portRange,
    });
    registry.ports[configDirectory] = ports;

    const logPath = logPathFor(configDirectory);
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    const logFd = fs.openSync(logPath, 'w');
    // detached makes the server the leader of a new process group (a new
    // console on Windows), so it outlives the agent tool call that asked for it
    // and stopProcessGroup can stop exactly its processes.
    const child = spawn(devCommand.command, devCommand.args, {
      cwd: configDirectory,
      detached: true,
      // The requester's environment, not the hub's: the hub was started by
      // whichever session came first, and PATH, the Node version and secrets
      // sessions differ between them.
      env: {
        ...(env ?? process.env),
        LOWDEFY_DEV_OWNER: 'hub',
        LOWDEFY_DEV_PORT: String(ports.port),
        LOWDEFY_SERVER_DEV_INTERNAL_PORT: String(ports.internalPort),
      },
      shell: process.platform === 'win32',
      stdio: ['ignore', logFd, logFd],
      windowsHide: true,
    });
    fs.closeSync(logFd);
    exits.delete(configDirectory);
    child.on('error', (error) => {
      exits.set(configDirectory, { error: error.message, at: new Date().toISOString() });
    });
    child.on('exit', (code, signal) => {
      exits.set(configDirectory, { code, signal, at: new Date().toISOString() });
      // The leader's life is the server's. A manager killed outright (out of
      // memory, kill -9) takes the leader down but leaves Vite running in the
      // group, holding the app's internal port with nothing left to stop it.
      stopProcessGroup({ pid: child.pid });
      if (registry.instances[configDirectory]?.pid === child.pid) {
        delete registry.instances[configDirectory];
        saveRegistry();
      }
    });

    registry.instances[configDirectory] = {
      pid: child.pid,
      processStartTime: getProcessStartTime({ pid: child.pid }),
      command: devCommand.display,
      startedAt: new Date().toISOString(),
    };
    saveRegistry();
    logger.info(`Started ${configDirectory} on port ${ports.port}: ${devCommand.display}`);
  }

  async function stop(params) {
    const configDirectory = realDirectory(params.configDirectory);
    return serialize(() => stopServer({ configDirectory }));
  }

  // Returns the answer when there is nothing to wait for, else null once the
  // server is running or launched.
  async function launchUnlessRunning({ configDirectory, env, restart, clean }) {
    const current = describe(configDirectory);
    const running = ['starting', 'ready'].includes(current.state);
    if (running && current.owner !== 'hub') {
      // A terminal server stays the user's. The caller restarts it in place
      // through its own dev tools when asked to.
      return current;
    }
    if (running && !restart && !clean) {
      return null;
    }
    if (running) {
      if (!current.managed) {
        return {
          ...current,
          note: 'This dev server was started by another hub; it cannot be restarted from here.',
        };
      }
      await stopServer({ configDirectory });
    }
    if (clean) {
      fs.rmSync(path.join(configDirectory, '.lowdefy', 'dev', 'build'), {
        recursive: true,
        force: true,
      });
    }
    await launch({ configDirectory, env });
    return null;
  }

  async function start({ env, restart = false, clean = false, ...params }) {
    const configDirectory = realDirectory(params.configDirectory);
    const answer = await serialize(() =>
      launchUnlessRunning({ configDirectory, env, restart, clean })
    );
    return answer ?? waitForReady(configDirectory);
  }

  function status({ configDirectory }) {
    return describe(realDirectory(configDirectory));
  }

  function logs({ lines = 100, grep, ...params }) {
    if (!type.isInt(lines) || lines < 1) {
      throw new Error(
        `"lines" must be a positive integer (at most ${MAX_LOG_LINES} are returned). Received ${JSON.stringify(
          lines
        )}.`
      );
    }
    const configDirectory = realDirectory(params.configDirectory);
    const record = readDevInstance({ configDirectory });
    if (record !== null && record.owner !== 'hub') {
      return {
        lines: [],
        note: "This dev server runs in the user's terminal; its output is there, not in the hub.",
      };
    }
    return { lines: readLogTail({ logPath: logPathFor(configDirectory), lines, grep }) };
  }

  function list() {
    forgetDeadServers();
    return {
      instances: Object.keys(registry.instances).map((configDirectory) =>
        describe(configDirectory)
      ),
    };
  }

  function attach({ connectionId, ...params }) {
    const configDirectory = realDirectory(params.configDirectory);
    if (!attachments.has(connectionId)) {
      attachments.set(connectionId, new Set());
    }
    attachments.get(connectionId).add(configDirectory);
    return { attached: true };
  }

  function isAttached(configDirectory) {
    return [...attachments.values()].some((directories) => directories.has(configDirectory));
  }

  function connectionClosed({ connectionId }) {
    const directories = attachments.get(connectionId) ?? new Set();
    attachments.delete(connectionId);
    directories.forEach((configDirectory) => {
      if (!isAttached(configDirectory)) {
        lastDetachedAt.set(configDirectory, Date.now());
      }
    });
  }

  // Whether an app was removed. Not its directory: a running dev server
  // recreates <app>/.lowdefy after its git worktree is deleted, so the app's
  // own lowdefy.yaml decides. A checkout or rebase can take the file away for
  // a moment, so the app counts as removed only after two reap passes in a row
  // found it missing.
  const appMisses = new Map();

  function countAppMisses() {
    const directories = new Set([
      ...Object.keys(registry.instances),
      ...Object.keys(registry.ports),
    ]);
    directories.forEach((configDirectory) => {
      if (hasLowdefyYaml({ directory: configDirectory })) {
        appMisses.delete(configDirectory);
        return;
      }
      appMisses.set(configDirectory, (appMisses.get(configDirectory) ?? 0) + 1);
    });
  }

  function isAppRemoved(configDirectory) {
    return (appMisses.get(configDirectory) ?? 0) >= 2;
  }

  // Ports stick to an app between runs, but a removed app - a deleted git
  // worktree, most often - never runs again. Kept, every worktree ever used
  // would hold a pair until the range ran out.
  function forgetRemovedApps() {
    Object.keys(registry.ports)
      .filter(
        (configDirectory) =>
          type.isUndefined(registry.instances[configDirectory]) && isAppRemoved(configDirectory)
      )
      .forEach((configDirectory) => {
        delete registry.ports[configDirectory];
        appMisses.delete(configDirectory);
      });
    saveRegistry();
  }

  // Stops servers nobody uses: the app was removed, or no agent session
  // has been attached and no browser tab open for IDLE_STOP_MS.
  async function reapOnce() {
    forgetDeadServers();
    countAppMisses();
    for (const [configDirectory, managed] of Object.entries(registry.instances)) {
      if (isAppRemoved(configDirectory)) {
        if (isManagedAlive(managed)) {
          await stopProcessGroup({ pid: managed.pid });
        }
        delete registry.instances[configDirectory];
        saveRegistry();
        logger.info(`Stopped ${configDirectory}: the app was removed.`);
        continue;
      }
      if (isAttached(configDirectory)) {
        continue;
      }
      const idleSince = lastDetachedAt.get(configDirectory) ?? Date.parse(managed.startedAt);
      if (Date.now() - idleSince < IDLE_STOP_MS) {
        continue;
      }
      const record = readDevInstance({ configDirectory });
      if (record !== null && (await openTabs({ url: record.url })) > 0) {
        continue;
      }
      await stop({ configDirectory });
      logger.info(`Stopped ${configDirectory}: idle.`);
    }
    forgetRemovedApps();
  }

  // The hub reaps on a timer, and a pass can outlast the interval (a slow dev
  // server answering the open-tabs check), so a pass still running is shared
  // rather than started again beside it.
  let reaping = null;
  function reap() {
    if (reaping === null) {
      reaping = reapOnce().finally(() => {
        reaping = null;
      });
    }
    return reaping;
  }

  function hasManagedServers() {
    return Object.keys(registry.instances).length > 0;
  }

  function hello() {
    return { protocol: HUB_PROTOCOL, version: cliVersion, pid: process.pid };
  }

  forgetDeadServers();

  return {
    attach,
    connectionClosed,
    hasManagedServers,
    hello,
    list,
    logs,
    reap,
    saveRegistry,
    start,
    status,
    stop,
  };
}

export default createHub;
