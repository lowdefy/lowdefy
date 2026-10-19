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
import {
  compareProcessStartTimes,
  isProcessStartTime,
  readDevInstance,
  readDevInstanceAsync,
  readDevInstanceRecord,
  readProcessStartTime,
} from '@lowdefy/node-utils';

import allocatePorts from './allocatePorts.js';
import createStartSlots from './createStartSlots.js';
import hasLowdefyYaml from '../../utils/hasLowdefyYaml.js';
import fetchOpenTabs from './fetchOpenTabs.js';
import {
  HUB_PROTOCOL,
  IDLE_LIMIT_MS,
  IDLE_STOP_MS,
  MAX_LOG_LINES,
  PORT_RANGE,
  READY_TIMEOUT_MS,
  SOFT_CAP_SERVERS,
  START_SLOT_HOLD_MS,
  START_SLOTS,
} from './hubProtocol.js';
import readLogTail from './readLogTail.js';
import readMemoryPressure from './readMemoryPressure.js';
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
// An entry with no start time to compare (written before Windows had start
// times, or by an older hub as local time), or a start time that cannot be
// read now, leaves the pid to decide. The read never blocks: on Windows it
// starts PowerShell, and the hub must keep answering its sessions meanwhile.
async function isManagedAlive(managed) {
  if (!isGroupAlive(managed.pid)) {
    return false;
  }
  if (!isProcessStartTime(managed.processStartTime)) {
    return true;
  }
  const startTime = await readProcessStartTime({ pid: managed.pid });
  return (
    compareProcessStartTimes({ recorded: managed.processStartTime, current: startTime }) !==
    'different'
  );
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
  readPressure = readMemoryPressure,
  readyTimeoutMs = READY_TIMEOUT_MS,
  startSlotHoldMs = START_SLOT_HOLD_MS,
}) {
  const registry = loadRegistry(paths);
  const exits = new Map();
  // The child of each app's latest launch, so a replaced server's exit is not taken for its
  // replacement's.
  const launchedChildren = new Map();
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

  async function forgetDeadServers() {
    for (const [configDirectory, managed] of Object.entries(registry.instances)) {
      // A launch while the start time was read may have replaced the entry.
      if (!(await isManagedAlive(managed)) && registry.instances[configDirectory] === managed) {
        delete registry.instances[configDirectory];
      }
    }
    saveRegistry();
  }

  // A launched server holds its start slot until it is ready or gone. The
  // slots ask synchronously, so this reads the record without waiting.
  function isStarting({ configDirectory, pid }) {
    const managed = registry.instances[configDirectory];
    if (type.isUndefined(managed) || managed.pid !== pid || !isGroupAlive(pid)) {
      return false;
    }
    return readDevInstance({ configDirectory })?.state !== 'ready';
  }

  const startSlots = createStartSlots({
    readPressure,
    isStarting,
    onFree: () => launchQueued(),
    holdMs: startSlotHoldMs,
    slots: START_SLOTS,
  });

  async function describe(configDirectory) {
    const record = await readDevInstanceAsync({ configDirectory });
    const managed = registry.instances[configDirectory];
    if (record !== null) {
      return {
        configDirectory,
        owner: record.owner,
        state: record.state,
        url: record.url,
        pid: record.pid,
        startedAt: record.startedAt,
        version: record.version,
        managed: record.owner === 'hub' && !type.isUndefined(managed),
        command: managed?.command,
      };
    }
    if (!type.isUndefined(managed) && (await isManagedAlive(managed))) {
      // A record this hub cannot verify (a Lowdefy version that records process
      // start times another way) reads as starting for as long as the server
      // runs. Its version lets the shim tell the agent the versions differ.
      const unverified = readDevInstanceRecord({ configDirectory });
      return {
        configDirectory,
        owner: 'hub',
        state: 'starting',
        pid: managed.pid,
        startedAt: managed.startedAt,
        version: unverified?.version,
        managed: true,
        command: managed.command,
      };
    }
    if (startSlots.isQueued(configDirectory)) {
      return {
        configDirectory,
        state: 'queued',
        ahead: startSlots.ahead(configDirectory),
        managed: false,
      };
    }
    if (startSlots.isLaunching(configDirectory)) {
      return { configDirectory, owner: 'hub', state: 'starting', managed: true };
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

  async function waitForReady({ configDirectory, deadline }) {
    while (Date.now() < deadline) {
      const status = await describe(configDirectory);
      if (status.state === 'ready') {
        return status;
      }
      if (status.state === 'exited') {
        return {
          ...status,
          logTail: readLogTail({ logPath: logPathFor(configDirectory), lines: 30 }),
        };
      }
      // Stopped by another caller while this one waited.
      if (status.state === 'stopped') {
        return status;
      }
      await wait(250);
    }
    const status = await describe(configDirectory);
    if (status.state === 'queued') {
      const starts = startSlots.held() + status.ahead;
      return {
        ...status,
        note: `Queued behind ${starts} other start${
          starts === 1 ? '' : 's'
        } on this machine. Call again to keep waiting; your place is kept.`,
      };
    }
    return {
      ...status,
      logTail: readLogTail({ logPath: logPathFor(configDirectory), lines: 10 }),
      note: `Not ready after ${
        readyTimeoutMs / 1000
      }s - it may still be installing or building. Call again to keep waiting.`,
    };
  }

  async function stopServer({ configDirectory }) {
    const managed = registry.instances[configDirectory];
    if (type.isUndefined(managed)) {
      const record = await readDevInstanceAsync({ configDirectory });
      if (record !== null) {
        return {
          stopped: false,
          reason: `This dev server was not started by the hub (owner ${record.owner}, pid ${record.pid}). Ask the user to stop it.`,
        };
      }
      return { stopped: false, reason: 'No dev server is running for this app.' };
    }
    if (await isManagedAlive(managed)) {
      await stopProcessGroup({ pid: managed.pid });
    }
    delete registry.instances[configDirectory];
    saveRegistry();
    startSlots.release(configDirectory);
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
    launchedChildren.set(configDirectory, child);
    exits.delete(configDirectory);
    child.on('error', (error) => {
      if (launchedChildren.get(configDirectory) === child) {
        exits.set(configDirectory, { error: error.message, at: new Date().toISOString() });
      }
    });
    child.on('exit', (code, signal) => {
      // On a restart the old server's exit can arrive after its replacement launched (on Windows
      // taskkill returns before the exit event): it says nothing about the replacement.
      if (launchedChildren.get(configDirectory) === child) {
        exits.set(configDirectory, { code, signal, at: new Date().toISOString() });
      }
      // The leader's life is the server's. A manager killed outright (out of
      // memory, kill -9) takes the leader down but leaves Vite running in the
      // group, holding the app's internal port with nothing left to stop it.
      stopProcessGroup({ pid: child.pid });
      if (registry.instances[configDirectory]?.pid === child.pid) {
        delete registry.instances[configDirectory];
        saveRegistry();
      }
      startSlots.tick();
    });

    const processStartTime = await readProcessStartTime({ pid: child.pid });
    if (exits.has(configDirectory)) {
      // It exited while its start time was read: there is nothing to record.
      return;
    }
    registry.instances[configDirectory] = {
      pid: child.pid,
      processStartTime,
      command: devCommand.display,
      startedAt: new Date().toISOString(),
    };
    saveRegistry();
    logger.info(`Started ${configDirectory} on port ${ports.port}: ${devCommand.display}`);
    return child.pid;
  }

  // Launches with the start slot already taken for this app; the slot passes
  // to the server, or back if the launch fails.
  async function launchWithSlot({ configDirectory, env }) {
    try {
      const pid = await launch({ configDirectory, env });
      startSlots.hold({ configDirectory, pid });
    } catch (error) {
      startSlots.release(configDirectory);
      throw error;
    }
  }

  // Starts the apps waiting for a slot, as slots free. Each launch runs
  // through serialize, like any start, and is skipped if the app has been
  // started meanwhile. A failed launch is reported to whoever waits on it.
  function launchQueued() {
    for (;;) {
      const next = startSlots.takeNext();
      if (next === null) {
        return;
      }
      serialize(async () => {
        if (await isServerRunning(next.configDirectory)) {
          startSlots.release(next.configDirectory);
          return;
        }
        await launchWithSlot(next);
      }).catch((error) => {
        exits.set(next.configDirectory, { error: error.message, at: new Date().toISOString() });
        logger.error(`Could not start ${next.configDirectory}: ${error.message}`);
      });
    }
  }

  // Whether a server runs for the app, read from the record and the registry
  // alone: the slot taken for a queued launch must not read as running.
  async function isServerRunning(configDirectory) {
    const record = await readDevInstanceAsync({ configDirectory });
    if (record !== null) {
      return ['starting', 'ready'].includes(record.state);
    }
    const managed = registry.instances[configDirectory];
    return !type.isUndefined(managed) && (await isManagedAlive(managed));
  }

  async function stop(params) {
    const configDirectory = realDirectory(params.configDirectory);
    // A queued app has nothing running yet: taking it off the queue stops it.
    if (startSlots.dequeue(configDirectory)) {
      return { stopped: true };
    }
    return serialize(() => stopServer({ configDirectory }));
  }

  // Returns the answer when there is nothing to wait for, else null once the
  // server is running, launched or queued for a start slot.
  async function launchUnlessRunning({ configDirectory, env, restart, clean }) {
    if (startSlots.isQueued(configDirectory)) {
      return null;
    }
    const current = await describe(configDirectory);
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
    if (!startSlots.tryTake(configDirectory)) {
      startSlots.enqueue({ configDirectory, env });
      return null;
    }
    await launchWithSlot({ configDirectory, env });
    return null;
  }

  // Under memory pressure, stop the servers that are already idle before a
  // new one adds its memory, instead of up to a reap interval later. Outside
  // serialize: the pass stops servers through it.
  async function reapBeforeLaunch({ configDirectory }) {
    if (readPressure() === 'normal') {
      return;
    }
    if (Object.keys(registry.instances).length < SOFT_CAP_SERVERS) {
      return;
    }
    if (await isServerRunning(configDirectory)) {
      return;
    }
    await reap();
  }

  // Waits for ready up to readyTimeoutMs from the request, time queued for a
  // start slot included, and answers once.
  async function start({ env, restart = false, clean = false, ...params }) {
    const deadline = Date.now() + readyTimeoutMs;
    const configDirectory = realDirectory(params.configDirectory);
    await reapBeforeLaunch({ configDirectory });
    const answer = await serialize(() =>
      launchUnlessRunning({ configDirectory, env, restart, clean })
    );
    return answer ?? waitForReady({ configDirectory, deadline });
  }

  async function status({ configDirectory }) {
    return describe(realDirectory(configDirectory));
  }

  async function logs({ lines = 100, grep, ...params }) {
    if (!type.isInt(lines) || lines < 1) {
      throw new Error(
        `"lines" must be a positive integer (at most ${MAX_LOG_LINES} are returned). Received ${JSON.stringify(
          lines
        )}.`
      );
    }
    const configDirectory = realDirectory(params.configDirectory);
    const record = await readDevInstanceAsync({ configDirectory });
    if (record !== null && record.owner !== 'hub') {
      return {
        lines: [],
        note: "This dev server runs in the user's terminal; its output is there, not in the hub.",
      };
    }
    return { lines: readLogTail({ logPath: logPathFor(configDirectory), lines, grep }) };
  }

  async function list() {
    await forgetDeadServers();
    return {
      instances: await Promise.all(
        Object.keys(registry.instances).map((configDirectory) => describe(configDirectory))
      ),
    };
  }

  // Attachment decides only for a server on an older server-dev, whose
  // instance record does not say when it was last used (see isIdle). The shim
  // keeps attaching for those.
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

  // A server that has said `starting` for longer than a start may hold its
  // slot is stalled - its first child never answered (a plugin that fails to
  // load) and the record stays `starting` with the manager alive - and is
  // judged on its use like a ready one, or nothing would ever stop it.
  function isStartingOrBusy(record) {
    const stalled =
      record.state === 'starting' && Date.now() - Date.parse(record.startedAt) > startSlotHoldMs;
    if (record.state !== 'ready' && !stalled) {
      return true;
    }
    return record.building === true || record.activeRequests > 0;
  }

  // Whether nobody has used a server for the idle limit. The dev manager
  // records its own last use (requests through its port, builds) in the
  // instance record; an agent session holding a hub connection does not count,
  // since helper agents share their parent session's one connection and would
  // keep every server they touched alive for the parent's whole session.
  async function isIdle({ record, managed, idleLimitMs, configDirectory }) {
    if (record !== null && !type.isNone(record.lastActivityAt)) {
      if (isStartingOrBusy(record)) {
        return false;
      }
      if (Date.now() - Date.parse(record.lastActivityAt) <= idleLimitMs) {
        return false;
      }
    } else {
      if (isAttached(configDirectory)) {
        return false;
      }
      const idleSince = lastDetachedAt.get(configDirectory) ?? Date.parse(managed.startedAt);
      if (Date.now() - idleSince < IDLE_STOP_MS) {
        return false;
      }
    }
    // A tab poll that fails counts as no tabs: the record already said idle.
    return record === null || (await openTabs({ url: record.url })) === 0;
  }

  // Whether a server was used after the reaper judged it idle: the tab poll
  // and the wait for serialize leave time for a request to begin, and the
  // manager writes one that starts on an idle record at once. A different
  // registry entry or pid is a server started (or stopped) since, not the one
  // judged; a restart queued ahead of the reap launches one that has not yet
  // written its record.
  async function isUsedSince({ configDirectory, managed, seen }) {
    if (registry.instances[configDirectory] !== managed) {
      return true;
    }
    if (seen === null || type.isNone(seen.lastActivityAt)) {
      return false;
    }
    const current = await readDevInstanceAsync({ configDirectory });
    if (current === null) {
      return false;
    }
    return (
      current.pid !== seen.pid ||
      current.activeRequests > 0 ||
      current.lastActivityAt !== seen.lastActivityAt
    );
  }

  // Stops servers nobody uses: the app was removed, or nobody has used it for
  // the idle limit and no browser tab has it open.
  async function reapOnce() {
    await forgetDeadServers();
    countAppMisses();
    const pressure = readPressure();
    const idleLimitMs = IDLE_LIMIT_MS[pressure];
    for (const [configDirectory, managed] of Object.entries(registry.instances)) {
      if (isAppRemoved(configDirectory)) {
        if (await isManagedAlive(managed)) {
          await stopProcessGroup({ pid: managed.pid });
        }
        delete registry.instances[configDirectory];
        saveRegistry();
        logger.info(`Stopped ${configDirectory}: the app was removed.`);
        continue;
      }
      const record = await readDevInstanceAsync({ configDirectory });
      if (!(await isIdle({ record, managed, idleLimitMs, configDirectory }))) {
        continue;
      }
      const stopped = await serialize(async () => {
        if (await isUsedSince({ configDirectory, managed, seen: record })) {
          return false;
        }
        await stopServer({ configDirectory });
        return true;
      });
      if (stopped) {
        logger.info(
          `Stopped ${configDirectory}: idle for over ${
            idleLimitMs / 60000
          } minutes (memory pressure ${pressure}).`
        );
      }
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

  // Queued like a start or stop, so neither acts on the registry before the
  // dead entries it was loaded with are gone. A replacement hub then adopts
  // servers still starting with the slots they hold.
  serialize(async () => {
    await forgetDeadServers();
    for (const [configDirectory, managed] of Object.entries(registry.instances)) {
      const record = await readDevInstanceAsync({ configDirectory });
      if (record?.state !== 'ready') {
        startSlots.hold({
          configDirectory,
          pid: managed.pid,
          takenAt: Date.parse(managed.startedAt),
        });
      }
    }
  }).catch((error) => logger.error(`Forgetting dead servers failed: ${error.message}`));

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
