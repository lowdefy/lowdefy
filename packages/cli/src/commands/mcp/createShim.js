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
import semver from 'semver';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { type } from '@lowdefy/helpers';
import { readDevInstanceAsync } from '@lowdefy/node-utils';

import callWithReconnect from './callWithReconnect.js';
import checkDependenciesInstalled from './checkDependenciesInstalled.js';
import createCheckoutGuard from './createCheckoutGuard.js';
import createHubConnection from './createHubConnection.js';
import createInstanceConnections from './createInstanceConnections.js';
import describeVersionMismatch from './describeVersionMismatch.js';
import fetchBuildSummary from './fetchBuildSummary.js';
import findApps from './findApps.js';
import findGitRoot from './findGitRoot.js';
import formatInstanceLabel from './formatInstanceLabel.js';
import isNewerVersion from './isNewerVersion.js';
import isSameVersion from './isSameVersion.js';
import lifecycleTools, { DIRECTORY_PROPERTY } from './lifecycleTools.js';
import resolveApp from './resolveApp.js';
import runAppTests from './runAppTests.js';
import touchDevServer from './touchDevServer.js';

// Dev tool calls can drive a browser through a whole journey.
const TOOL_CALL_TIMEOUT_MS = 10 * 60 * 1000;

// Restart is lowdefy_dev_start({ restart: true }): one restart tool, which does
// a full process restart when the hub owns the server.
const HIDDEN_DEV_TOOLS = new Set(['lowdefy_restart']);

const LIFECYCLE_TOOL_NAMES = new Set(lifecycleTools.map((tool) => tool.name));

const SHIM_INSTRUCTIONS = `This is \`lowdefy mcp\`. It routes every lowdefy_ tool to the dev server of the app you are working in and starts that server when it is not running - never run \`lowdefy dev\` yourself, never choose ports, and never kill processes by port or name; use lowdefy_dev_start and lowdefy_dev_stop. Restart (lowdefy_dev_start with restart: true) only when the server seems stuck or build status looks stale, or after secrets a wrapper (for example infisical) injects have changed; .env edits and local plugin code are picked up without one. Pass "directory" when you work in a different git worktree from the session (for example as a subagent), when the repository holds several apps, or when you work on another project; it must be in this checkout, one of its git worktrees, or a repository the user trusts (the user is asked, or runs \`lowdefy hub trust <directory>\` in their own terminal; never run \`lowdefy hub trust\` yourself). If lowdefy_dev_start reports that dependencies are not installed, run the install command it names, then call it again. Every result starts with the app and checkout it came from. When you finish work in a git worktree you created for the task, call lowdefy_dev_stop with that "directory" before you report back. Do not stop a server in a checkout you share with another agent. A server left running stops once it has been idle for 15 minutes.`;

// The hub stops servers nobody uses (see the hub's reaper); an agent that
// knows it can stop its own and need not keep one alive.
const IDLE_STOP_NOTE =
  'The hub stops this server once nobody has used it for 15 minutes (sooner when the machine is short of memory); the next lowdefy_ call starts it again.';

function textResult(value) {
  const text = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return { content: [{ type: 'text', text }] };
}

function errorResult(message) {
  return { content: [{ type: 'text', text: message }], isError: true };
}

function withDirectory(tool) {
  return {
    ...tool,
    inputSchema: {
      ...tool.inputSchema,
      properties: { ...(tool.inputSchema.properties ?? {}), directory: DIRECTORY_PROPERTY },
    },
  };
}

function describeNotReady({ label, status }) {
  // A hub from another Lowdefy version may answer without a status.
  if (type.isNone(status)) {
    return `${label}: the hub reported no status for the dev server. Call lowdefy_dev_status to see where it stands.`;
  }
  if (status.state === 'exited') {
    const tail = (status.logTail ?? []).join('\n');
    return `${label}: the dev server exited before it was ready. Last output:\n${tail}\n\nIf this needs something only the user can do (a secrets login, a missing dependency), ask them, then call lowdefy_dev_start again.`;
  }
  const tail = (status.logTail ?? []).join('\n');
  return `${label}: the dev server is still ${status.state}. ${status.note ?? ''}\n${tail}`.trim();
}

// A record another Lowdefy version wrote can be in a format this one cannot
// read (an older CLI compared process start times in another format).
// Unreadable counts as no record, so the hub - which started the server and
// read its record itself - decides where it runs.
async function readRunningInstance({ configDirectory }) {
  try {
    return await readDevInstanceAsync({ configDirectory });
  } catch {
    return null;
  }
}

// Why a forwarded call never got an answer, for the agent. The fetch under
// the MCP client throws a bare TypeError ("fetch failed") when the server is
// unreachable, which says nothing of where or what to do.
function describeForwardError({ label, name, url, error }) {
  if (error instanceof McpError && error.code === ErrorCode.ConnectionClosed) {
    return `${label}: the dev server stopped or dropped the connection before ${name} answered, so the call may have run in part. Call lowdefy_dev_status, then lowdefy_dev_start if it is not ready, and try again.`;
  }
  // By name: undici's TypeError can come from another realm than this module's.
  if (error.name === 'TypeError') {
    return `${label}: could not reach the dev server at ${url} to call ${name} (${error.message}). Call lowdefy_dev_status, then lowdefy_dev_start if it is not ready, and try again.`;
  }
  return `${label}: ${name} failed: ${error.message}`;
}

function createShim({ cliVersion, cliDirectory, cwd, devTools }) {
  const hub = createHubConnection();
  const server = new Server(
    { name: 'lowdefy', version: cliVersion },
    {
      capabilities: { tools: { listChanged: true }, logging: {} },
      instructions: `${SHIM_INSTRUCTIONS}\n\n${devTools.instructions}`,
    }
  );
  // Each forwarded tool's definition, with the Lowdefy version it came from.
  // Map order is insertion order, and replacing a definition keeps its place.
  const forwarded = new Map();
  devTools.tools
    .filter((tool) => !HIDDEN_DEV_TOOLS.has(tool.name))
    .forEach((tool) => {
      forwarded.set(tool.name, { version: cliVersion, tool: withDirectory(tool) });
    });

  // The list a session starts with is this CLI's, which need not be the
  // version a project pins. Each dev server reports its tools when the shim
  // connects: tools this CLI does not know are added, and a server newer than
  // the version a tool's definition came from replaces that definition, so
  // the schema and description follow the newest Lowdefy met. The client is
  // told to list again. The list only grows: the session may hold several
  // apps. A server whose version is not valid semver changes nothing. A
  // prerelease is not compared with another major (isNewerVersion):
  // experimental builds are 0.0.0-experimental-*, which semver ranks below
  // every release, so a shim on one would otherwise lose its definitions to
  // the first released server it met.
  //
  // The server's version is the one its instance status reports (the hub's
  // status, or the record a running server wrote, which is what the hub
  // reads), the same source the version note below compares.
  async function learnTools({ client, instance }) {
    const serverVersion = semver.valid(instance.version);
    if (serverVersion === null) {
      return;
    }
    let listed;
    try {
      listed = await client.listTools();
    } catch {
      return;
    }
    let changed = false;
    listed.tools.forEach((tool) => {
      if (HIDDEN_DEV_TOOLS.has(tool.name) || LIFECYCLE_TOOL_NAMES.has(tool.name)) {
        return;
      }
      const known = forwarded.get(tool.name);
      if (
        known === undefined ||
        isNewerVersion({ candidate: serverVersion, held: known.version })
      ) {
        forwarded.set(tool.name, { version: serverVersion, tool: withDirectory(tool) });
        changed = true;
      }
    });
    if (changed) {
      await server.sendToolListChanged().catch(() => {});
    }
  }

  const instances = createInstanceConnections({
    cliVersion,
    onNotification: (params) => server.sendLoggingMessage(params).catch(() => {}),
    onOpen: learnTools,
  });

  const authorizeApp = createCheckoutGuard({ cwd, server });

  async function resolve({ directory }) {
    const app = resolveApp({ directory, cwd });
    await authorizeApp(app);
    return { ...app, label: formatInstanceLabel(app) };
  }

  // A running server is used as it is - the user's terminal server included.
  // Anything else goes to the hub, which starts it and waits for ready. The
  // hub's answer is the server to call: it read the instance record itself, and
  // reading it again here can disagree with it (a CLI older than the dev server
  // that wrote the record), so calls go where lowdefy_dev_status says it runs.
  async function ensureRunning(app) {
    const running = await readRunningInstance({ configDirectory: app.configDirectory });
    if (running !== null && running.state === 'ready') {
      if (running.owner === 'hub' || hub.isConnected()) {
        await hub.attach(app);
      }
      return running;
    }
    checkDependenciesInstalled({ configDirectory: app.configDirectory, root: app.root });
    await hub.attach(app);
    const status = await hub.request('start', {
      configDirectory: app.configDirectory,
      env: process.env,
    });
    if (status?.state !== 'ready') {
      const message = describeNotReady({ label: app.label, status });
      // A server on another Lowdefy version can stay "starting" to this hub
      // while it serves, so the versions are the first thing to check.
      const note = type.isNone(status)
        ? null
        : versionNote({ app, instance: status, isError: true });
      throw new Error(note === null ? message : `${message}\n\n${note}`);
    }
    return status;
  }

  // Server versions already noted on a successful call, so the note is said
  // once a session rather than on every call.
  const notedVersions = new Set();

  // The note a forwarded call carries when this shim and the dev server run
  // different Lowdefy versions: always on a failure, once on a success. The
  // call itself goes to the server's own /lowdefy-docs/mcp either way, so it
  // runs with the server's own tool contract.
  function versionNote({ app, instance, isError }) {
    if (
      typeof instance.version !== 'string' ||
      isSameVersion({ a: cliVersion, b: instance.version })
    ) {
      return null;
    }
    if (!isError && notedVersions.has(instance.version)) {
      return null;
    }
    notedVersions.add(instance.version);
    return `Note: ${describeVersionMismatch({
      cliVersion,
      serverVersion: instance.version,
      cliDirectory,
      appRoot: app.root,
    })}`;
  }

  async function callDevTool({ name, args }) {
    const { directory, ...toolArgs } = args;
    const app = await resolve({ directory });
    const instance = await ensureRunning(app);
    const call = async () => {
      const client = await instances.get({
        configDirectory: app.configDirectory,
        instance,
        label: app.label,
      });
      return client.callTool({ name, arguments: toolArgs }, undefined, {
        timeout: TOOL_CALL_TIMEOUT_MS,
        resetTimeoutOnProgress: true,
      });
    };
    let result;
    try {
      result = await callWithReconnect({
        call,
        reconnect: () => instances.drop({ configDirectory: app.configDirectory }),
      });
    } catch (error) {
      // Not retried here: the dev server may have run part of the call. The
      // connection is dropped so the next call opens a fresh one.
      await instances.drop({ configDirectory: app.configDirectory });
      const message = describeForwardError({ label: app.label, name, url: instance.url, error });
      const note = versionNote({ app, instance, isError: true });
      throw new Error(note === null ? message : `${message}\n\n${note}`);
    }
    const content = [
      { type: 'text', text: `${app.label} · ${instance.url}` },
      ...(result.content ?? []),
    ];
    // The handlers come from the dev server, whose version follows the app,
    // so a tool or option this CLI lists can differ from the server's.
    const note = versionNote({ app, instance, isError: result.isError === true });
    if (note !== null) {
      content.push({ type: 'text', text: note });
    }
    return { ...result, content };
  }

  async function status({ directory }) {
    const app = await resolve({ directory });
    const hubStatus = await hub.request(
      'status',
      { configDirectory: app.configDirectory },
      { autoStart: false }
    );
    const record = await readRunningInstance({ configDirectory: app.configDirectory });
    const current = hubStatus ?? {
      configDirectory: app.configDirectory,
      owner: record?.owner,
      state: record?.state ?? 'stopped',
      url: record?.url,
      pid: record?.pid,
      startedAt: record?.startedAt,
      version: record?.version,
    };
    const build = current.state === 'ready' ? await fetchBuildSummary({ url: current.url }) : null;
    return { app: app.label, ...current, build };
  }

  // Connecting makes the server report its tools (learnTools), so the agent
  // sees a newer app's tools right after starting it, before any forwarded
  // call. A failure here must not fail the start: the next forwarded call
  // connects again.
  async function connectToLearnTools({ app, instance }) {
    if (instance.state !== 'ready') {
      return;
    }
    try {
      await instances.get({ configDirectory: app.configDirectory, instance, label: app.label });
    } catch {
      // Left to the next forwarded call.
    }
  }

  async function start({ directory, restart = false, clean = false }) {
    const app = await resolve({ directory });
    const running = await readRunningInstance({ configDirectory: app.configDirectory });
    if (running !== null && running.owner !== 'hub') {
      if (!restart && !clean) {
        await connectToLearnTools({ app, instance: running });
        return { app: app.label, ...running };
      }
      // Not the hub's to stop: restart it in place through its own dev tools.
      const client = await instances.get({
        configDirectory: app.configDirectory,
        instance: running,
        label: app.label,
      });
      await client.callTool({
        name: 'lowdefy_restart',
        arguments: { reason: 'lowdefy_dev_start' },
      });
      return {
        app: app.label,
        ...running,
        note: `Restarted in place. This server runs in the user's terminal, so ${
          clean ? 'the build directory was not cleaned and ' : ''
        }secrets a wrapper (for example infisical) injects only change when the user restarts it.`,
      };
    }
    // Before the hub is asked for anything, so an uninstalled app gets the
    // install command rather than a failed start. A running server is used as
    // it is.
    if (running?.state !== 'ready') {
      checkDependenciesInstalled({ configDirectory: app.configDirectory, root: app.root });
    }
    await hub.attach(app);
    const result = await hub.request('start', {
      configDirectory: app.configDirectory,
      env: process.env,
      restart,
      clean,
    });
    if (result?.state !== 'ready') {
      throw new Error(describeNotReady({ label: app.label, status: result }));
    }
    await touchDevServer({ url: result.url });
    await connectToLearnTools({ app, instance: result });
    // A note from the hub (a server another hub started, which it cannot
    // restart) says the request was not done, so it stands over the idle rule.
    return { app: app.label, ...result, note: result.note ?? IDLE_STOP_NOTE };
  }

  async function stop({ directory }) {
    const app = await resolve({ directory });
    const running = await readRunningInstance({ configDirectory: app.configDirectory });
    if (running !== null && running.owner !== 'hub') {
      return {
        app: app.label,
        stopped: false,
        reason: `This dev server runs in the user's terminal (pid ${running.pid}); ask the user to stop it.`,
      };
    }
    const result = await hub.request('stop', { configDirectory: app.configDirectory });
    await instances.drop({ configDirectory: app.configDirectory });
    return { app: app.label, ...result };
  }

  async function logs({ directory, lines = 100, grep }) {
    const app = await resolve({ directory });
    const result = await hub.request('logs', { configDirectory: app.configDirectory, lines, grep });
    return { app: app.label, ...result };
  }

  async function runTests({ directory, filter, tags, paths, repeat, tier, usageWindow }) {
    const app = await resolve({ directory });
    const instance = await ensureRunning(app);
    const result = await runAppTests({
      configDirectory: app.configDirectory,
      url: instance.url,
      filter,
      tags,
      paths,
      repeat,
      tier,
      usageWindow,
    });
    return { app: app.label, url: instance.url, ...result };
  }

  // Lists the checkout, not one app: resolving an app from a monorepo root
  // fails with "several apps" - the case this tool is for.
  async function list() {
    const root = findGitRoot({ directory: fs.realpathSync.native(cwd) });
    const apps = await Promise.all(
      findApps({ root }).map(async (configDirectory) => {
        const record = await readRunningInstance({ configDirectory });
        return {
          app: formatInstanceLabel({ configDirectory, root }),
          configDirectory,
          owner: record?.owner,
          state: record?.state ?? 'stopped',
          url: record?.url,
        };
      })
    );
    const managed = await hub.request('list', {}, { autoStart: false });
    const elsewhere = (managed?.instances ?? []).filter(
      (instance) => !apps.some((app) => app.configDirectory === instance.configDirectory)
    );
    return { checkout: root, apps, otherCheckouts: elsewhere };
  }

  const lifecycleHandlers = {
    lowdefy_dev_list: list,
    lowdefy_dev_logs: logs,
    lowdefy_dev_start: start,
    lowdefy_dev_status: status,
    lowdefy_dev_stop: stop,
    lowdefy_run_tests: runTests,
  };

  server.setRequestHandler(ListToolsRequestSchema, () => ({
    tools: [...lifecycleTools, ...[...forwarded.values()].map(({ tool }) => tool)],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name } = request.params;
    const args = request.params.arguments ?? {};
    try {
      if (lifecycleHandlers[name]) {
        return textResult(await lifecycleHandlers[name](args));
      }
      if (forwarded.has(name)) {
        return await callDevTool({ name, args });
      }
      return errorResult(`Unknown tool "${name}".`);
    } catch (error) {
      // A TypeError here is a fault in this shim, not something the agent
      // did: say whose, and where to look, rather than pass on a bare
      // "Cannot read properties of undefined".
      if (error.name === 'TypeError') {
        return errorResult(
          `lowdefy mcp ${cliVersion} failed running ${name} (${error.message}). Call lowdefy_dev_status to see the dev server's state and version.`
        );
      }
      return errorResult(error.message);
    }
  });

  async function close() {
    hub.close();
    await instances.closeAll();
  }

  return { close, server };
}

export { SHIM_INSTRUCTIONS };
export default createShim;
