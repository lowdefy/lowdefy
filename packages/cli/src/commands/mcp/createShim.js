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

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { readDevInstance } from '@lowdefy/node-utils';

import createHubConnection from './createHubConnection.js';
import createInstanceConnections from './createInstanceConnections.js';
import findApps from './findApps.js';
import formatInstanceLabel from './formatInstanceLabel.js';
import lifecycleTools, { DIRECTORY_PROPERTY } from './lifecycleTools.js';
import resolveApp from './resolveApp.js';
import runAppTests from './runAppTests.js';

// Dev tool calls can drive a browser through a whole journey.
const TOOL_CALL_TIMEOUT_MS = 10 * 60 * 1000;

// Restart is lowdefy_dev_start({ restart: true }): one restart tool, which does
// a full process restart when the hub owns the server.
const HIDDEN_DEV_TOOLS = new Set(['lowdefy_restart']);

const SHIM_INSTRUCTIONS = `This is \`lowdefy mcp\`. It routes every lowdefy_ tool to the dev server of the app you are working in and starts that server when it is not running - never run \`lowdefy dev\` yourself, never choose ports, and never kill processes by port or name; use lowdefy_dev_start (restart: true after local plugin or .env changes) and lowdefy_dev_stop. Pass "directory" when you work in a different git worktree from the session (for example as a subagent) or when the repository holds several apps. Every result starts with the app and checkout it came from.`;

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
  if (status.state === 'exited') {
    const tail = (status.logTail ?? []).join('\n');
    return `${label}: the dev server exited before it was ready. Last output:\n${tail}\n\nIf this needs something only the user can do (a secrets login, a missing dependency), ask them, then call lowdefy_dev_start again.`;
  }
  const tail = (status.logTail ?? []).join('\n');
  return `${label}: the dev server is still ${status.state}. ${status.note ?? ''}\n${tail}`.trim();
}

async function fetchBuildSummary({ url }) {
  try {
    const response = await fetch(`${url}/lowdefy-docs/build-status`);
    const { build, pages, clientErrors = [], serverErrors = [] } = await response.json();
    return {
      status: build?.status,
      errors: build?.errors?.length ?? 0,
      warnings: build?.warnings?.length ?? 0,
      failedPages: pages?.failed?.length ?? 0,
      clientErrors: clientErrors.length,
      serverErrors: serverErrors.length,
    };
  } catch {
    return null;
  }
}

function createShim({ cliVersion, cwd, devTools }) {
  const hub = createHubConnection();
  const server = new Server(
    { name: 'lowdefy', version: cliVersion },
    {
      capabilities: { tools: {}, logging: {} },
      instructions: `${SHIM_INSTRUCTIONS}\n\n${devTools.instructions}`,
    }
  );
  const instances = createInstanceConnections({
    cliVersion,
    onNotification: (params) => server.sendLoggingMessage(params).catch(() => {}),
  });

  const forwardedTools = devTools.tools.filter((tool) => !HIDDEN_DEV_TOOLS.has(tool.name));
  const forwardedNames = new Set(forwardedTools.map((tool) => tool.name));
  const tools = [...lifecycleTools, ...forwardedTools.map(withDirectory)];

  function resolve({ directory }) {
    const app = resolveApp({ directory, cwd });
    return { ...app, label: formatInstanceLabel(app) };
  }

  // A running server is used as it is - the user's terminal server included.
  // Anything else goes to the hub, which starts it and waits for ready.
  async function ensureRunning(app) {
    const running = readDevInstance({ configDirectory: app.configDirectory });
    if (running !== null && running.state === 'ready') {
      if (running.owner === 'hub' || hub.isConnected()) {
        await hub.attach(app);
      }
      return running;
    }
    await hub.attach(app);
    const status = await hub.request('start', {
      configDirectory: app.configDirectory,
      env: process.env,
    });
    if (status.state !== 'ready') {
      throw new Error(describeNotReady({ label: app.label, status }));
    }
    return readDevInstance({ configDirectory: app.configDirectory });
  }

  async function callDevTool({ name, args }) {
    const { directory, ...toolArgs } = args;
    const app = resolve({ directory });
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
      result = await call();
    } catch (error) {
      // The server restarted under a cached connection - reconnect once.
      await instances.drop({ configDirectory: app.configDirectory });
      result = await call();
    }
    const content = [
      { type: 'text', text: `${app.label} · ${instance.url}` },
      ...(result.content ?? []),
    ];
    // The tool list comes from this CLI; the handlers from the dev server,
    // whose version follows lowdefy.yaml. When they differ, a tool one side
    // lacks fails - say why.
    if (result.isError && instance.version && instance.version !== cliVersion) {
      content.push({
        type: 'text',
        text: `Note: lowdefy mcp is ${cliVersion} but this dev server is ${instance.version}; tools can differ between versions.`,
      });
    }
    return { ...result, content };
  }

  async function status({ directory }) {
    const app = resolve({ directory });
    const hubStatus = await hub.request(
      'status',
      { configDirectory: app.configDirectory },
      { autoStart: false }
    );
    const record = readDevInstance({ configDirectory: app.configDirectory });
    const current = hubStatus ?? {
      configDirectory: app.configDirectory,
      owner: record?.owner,
      state: record?.state ?? 'stopped',
      url: record?.url,
      pid: record?.pid,
      startedAt: record?.startedAt,
    };
    const build = current.state === 'ready' ? await fetchBuildSummary({ url: current.url }) : null;
    return { app: app.label, ...current, build };
  }

  async function start({ directory, restart = false, clean = false }) {
    const app = resolve({ directory });
    const running = readDevInstance({ configDirectory: app.configDirectory });
    if (running !== null && running.owner !== 'hub') {
      if (!restart && !clean) {
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
        }new local plugin code or .env changes need the user to restart it.`,
      };
    }
    await hub.attach(app);
    const result = await hub.request('start', {
      configDirectory: app.configDirectory,
      env: process.env,
      restart,
      clean,
    });
    if (result.state !== 'ready') {
      throw new Error(describeNotReady({ label: app.label, status: result }));
    }
    return { app: app.label, ...result };
  }

  async function stop({ directory }) {
    const app = resolve({ directory });
    const running = readDevInstance({ configDirectory: app.configDirectory });
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
    const app = resolve({ directory });
    const result = await hub.request('logs', { configDirectory: app.configDirectory, lines, grep });
    return { app: app.label, ...result };
  }

  async function runTests({ directory, filter }) {
    const app = resolve({ directory });
    const instance = await ensureRunning(app);
    const result = await runAppTests({
      configDirectory: app.configDirectory,
      url: instance.url,
      filter,
    });
    return { app: app.label, url: instance.url, ...result };
  }

  async function list() {
    const root = resolveApp({ directory: '.', cwd }).root;
    const apps = findApps({ root }).map((configDirectory) => {
      const record = readDevInstance({ configDirectory });
      return {
        app: formatInstanceLabel({ configDirectory, root }),
        configDirectory,
        owner: record?.owner,
        state: record?.state ?? 'stopped',
        url: record?.url,
      };
    });
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

  server.setRequestHandler(ListToolsRequestSchema, () => ({ tools }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name } = request.params;
    const args = request.params.arguments ?? {};
    try {
      if (lifecycleHandlers[name]) {
        return textResult(await lifecycleHandlers[name](args));
      }
      if (forwardedNames.has(name)) {
        return await callDevTool({ name, args });
      }
      return errorResult(`Unknown tool "${name}".`);
    } catch (error) {
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
