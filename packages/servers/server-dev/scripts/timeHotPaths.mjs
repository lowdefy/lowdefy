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
  Times the dev server's hot paths on one app, for LDF-788. The same script runs before and
  after the caches land, so its numbers compare.

  Usage (from the monorepo, after `pnpm build`):
    node packages/servers/server-dev/scripts/timeHotPaths.mjs --config-directory /path/to/app

  Options:
    --config-directory  App to serve (required). Its lowdefy.yaml and page files are edited
                        during the run and restored at the end. Pages need a `content:` line
                        and lowdefy.yaml a `name:` line.
    --pages             Page ids whose file is edited for the page-load timing (default p1..p5).
    --runs              Samples per timing (default 5).
    --port              Public port the manager binds (default 4351).
    --internal-port     Port of the Vite child (default 4352). The app may use it as a self URL.
    --dev-directory     Server copy under the repo root (default _server/dev-timing).
    --inspect-port      Port the child's inspector opens on, for the heap reading (default 9351).
    --attach            Time a server that is already running on these ports; start and stop none.
    --json <file>       Also write the raw samples to a file.

  Timed, each run on a fresh child unless noted:
    child start          A new Vite child seen in the process list -> its /api/ping answers
                         (resolution about 30 ms: the process list is polled). Child restarts are
                         requested through POST /lowdefy-docs/restart.
    app_map cold         First lowdefy_app_map call on that fresh child.
    app_map warm         Five more calls on the same child.
    heap before / after  heapUsed of the child after a full GC, read over the inspector (SIGUSR1),
                         before the first and after the last app_map call.
    page load            Edit a page file; once the manager has written build/reload (what the
                         browser waits on), time GET /<page> (HTML) and GET /api/page/<page>
                         (the JIT page build). Page load is their sum.
    skeleton rebuild     Edit lowdefy.yaml; time to the manager's next buildStatus.json write.
                         The child restart that follows is waited out, not timed.
*/

import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..');

const { values: args } = parseArgs({
  options: {
    'config-directory': { type: 'string' },
    pages: { type: 'string', default: 'p1,p2,p3,p4,p5' },
    runs: { type: 'string', default: '5' },
    port: { type: 'string', default: '4351' },
    'internal-port': { type: 'string', default: '4352' },
    'dev-directory': { type: 'string', default: '_server/dev-timing' },
    'inspect-port': { type: 'string', default: '9351' },
    attach: { type: 'boolean', default: false },
    json: { type: 'string' },
  },
});

if (!args['config-directory']) {
  console.error('--config-directory is required.');
  process.exit(1);
}

const configDirectory = path.resolve(args['config-directory']);
const pageIds = args.pages.split(',');
const runs = Number(args.runs);
const port = Number(args.port);
const internalPort = Number(args['internal-port']);
const inspectPort = Number(args['inspect-port']);
const buildDirectory = path.join(REPO_ROOT, args['dev-directory'], 'build');
const base = `http://localhost:${port}`;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function readFileOrNull(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    return null;
  }
}

// -- Server --------------------------------------------------------------------------------

let serverGroup = null;
const restores = [];

function listProcesses() {
  return execFileSync('ps', ['-A', '-o', 'pid=,command='], { encoding: 'utf8' })
    .split('\n')
    .map((line) => line.trim().match(/^(\d+)\s+(.*)$/))
    .filter(Boolean)
    .map((m) => ({ pid: Number(m[1]), command: m[2] }));
}

// The Vite child is the only process started with --expose-gc on the internal port.
function findChildPid() {
  const match = listProcesses().find(
    ({ command }) =>
      command.includes('--expose-gc') &&
      command.includes('--strictPort') &&
      command.includes(`--port ${internalPort}`)
  );
  return match?.pid ?? null;
}

async function ping(url) {
  try {
    const response = await fetch(`${url}/api/ping`, { signal: AbortSignal.timeout(2000) });
    return response.ok;
  } catch {
    return false;
  }
}

async function waitFor(check, { timeoutMs = 120000, intervalMs = 20, label }) {
  const start = performance.now();
  for (;;) {
    const result = await check();
    if (result) {
      return result;
    }
    if (performance.now() - start > timeoutMs) {
      throw new Error(`Timed out waiting for ${label}.`);
    }
    await sleep(intervalMs);
  }
}

async function startServer() {
  const gate = path.join(os.homedir(), 'github/.starling-heavy.sh');
  const command = fs.existsSync(gate) ? [gate, 'node'] : ['node'];
  const proc = spawn(
    command[0],
    [
      ...command.slice(1),
      'scripts/dev.mjs',
      '--config-directory',
      configDirectory,
      '--port',
      String(port),
      '--skip-build',
      '--no-open',
      '--dev-directory',
      args['dev-directory'],
    ],
    {
      cwd: REPO_ROOT,
      detached: true,
      stdio: ['ignore', 'ignore', 'ignore'],
      env: {
        ...process.env,
        LOWDEFY_SERVER_DEV_INTERNAL_PORT: String(internalPort),
        LOWDEFY_SERVER_DEV_STRICT_PORT: 'true',
        LOWDEFY_DEV_RECORD: 'false',
        // Opens only when the child gets SIGUSR1, on a port nothing else uses.
        NODE_OPTIONS: `--inspect-port=${inspectPort}`,
      },
    }
  );
  serverGroup = proc.pid;
  proc.on('exit', () => {
    serverGroup = null;
  });
  await waitFor(() => ping(base), { timeoutMs: 600000, intervalMs: 500, label: 'the server' });
  await waitFor(() => ping(`http://127.0.0.1:${internalPort}`), {
    timeoutMs: 600000,
    intervalMs: 200,
    label: 'the child',
  });
}

async function stopServer() {
  if (serverGroup === null) {
    return;
  }
  const group = serverGroup;
  try {
    process.kill(-group, 'SIGTERM');
  } catch {
    return;
  }
  for (let i = 0; i < 150 && serverGroup !== null; i++) {
    await sleep(100);
  }
  if (serverGroup !== null) {
    try {
      process.kill(-group, 'SIGKILL');
    } catch {
      // already gone
    }
  }
}

// -- Measurements --------------------------------------------------------------------------

async function callTool(name, toolArguments = {}) {
  const start = performance.now();
  const response = await fetch(`${base}/lowdefy-docs/mcp`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json, text/event-stream' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name, arguments: toolArguments },
    }),
  });
  const text = await response.text();
  const ms = performance.now() - start;
  if (!response.ok || text.includes('"isError":true')) {
    throw new Error(`${name} failed: ${response.status} ${text.slice(0, 200)}`);
  }
  return ms;
}

// heapUsed of the child after a full GC, over the V8 inspector that SIGUSR1 opens.
async function readHeapMb(pid) {
  process.kill(pid, 'SIGUSR1');
  const url = `http://127.0.0.1:${inspectPort}/json/list`;
  const target = await waitFor(
    async () => {
      try {
        const list = await (await fetch(url, { signal: AbortSignal.timeout(1000) })).json();
        return list[0]?.webSocketDebuggerUrl;
      } catch {
        return null;
      }
    },
    { timeoutMs: 10000, intervalMs: 100, label: 'the child inspector' }
  );
  const socket = new WebSocket(target);
  await new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = () => reject(new Error('Inspector connection failed.'));
  });
  const value = await new Promise((resolve, reject) => {
    socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.id === 1) {
        resolve(message.result?.result?.value);
      }
    };
    socket.onerror = () => reject(new Error('Inspector error.'));
    socket.send(
      JSON.stringify({
        id: 1,
        method: 'Runtime.evaluate',
        params: {
          expression: '(globalThis.gc(), globalThis.gc(), process.memoryUsage().heapUsed)',
          returnByValue: true,
        },
      })
    );
  });
  socket.close();
  return value / 1024 / 1024;
}

// Requests a restart and times the new child from first seen to answering.
async function timeChildStart() {
  const oldPid = findChildPid();
  const requestedAt = performance.now();
  await fetch(`${base}/lowdefy-docs/restart`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ reason: 'timeHotPaths' }),
  });
  let newPid = null;
  const seenAt = await waitFor(
    () => {
      const pid = findChildPid();
      if (pid !== null && pid !== oldPid) {
        newPid = pid;
        return performance.now();
      }
      return null;
    },
    { intervalMs: 30, label: 'the new child' }
  );
  await waitFor(() => ping(`http://127.0.0.1:${internalPort}`), {
    intervalMs: 10,
    label: 'the new child to answer',
  });
  const answeredAt = performance.now();
  await sleep(1500);
  return { childStartMs: answeredAt - seenAt, restartMs: answeredAt - requestedAt, pid: newPid };
}

async function timeAppMap() {
  const pid = findChildPid();
  const heapBeforeMb = await readHeapMb(pid);
  const coldMs = await callTool('lowdefy_app_map');
  const warmMs = [];
  for (let i = 0; i < 5; i++) {
    warmMs.push(await callTool('lowdefy_app_map'));
  }
  const heapAfterMb = await readHeapMb(pid);
  return { coldMs, warmMs, heapBeforeMb, heapAfterMb };
}

function editFile(file, replacer) {
  const original = readFileOrNull(file);
  if (original === null) {
    throw new Error(`Cannot read ${file}.`);
  }
  if (!restores.some((entry) => entry.file === file)) {
    restores.push({ file, original });
  }
  const edited = replacer(original);
  if (edited === original) {
    throw new Error(`The edit changed nothing in ${file}.`);
  }
  fs.writeFileSync(file, edited);
}

async function timePageLoad(pageId, run) {
  const reloadBefore = readFileOrNull(path.join(buildDirectory, 'reload'));
  editFile(path.join(configDirectory, 'pages', `${pageId}.yaml`), (text) =>
    text.replace(/content: .*/, `content: Timed edit ${pageId} ${run}`)
  );
  await waitFor(() => readFileOrNull(path.join(buildDirectory, 'reload')) !== reloadBefore, {
    intervalMs: 5,
    label: `the reload after editing ${pageId}`,
  });
  const htmlStart = performance.now();
  const html = await fetch(`${base}/${pageId}`);
  await html.text();
  const htmlMs = performance.now() - htmlStart;
  if (!html.ok) {
    throw new Error(`GET /${pageId} answered ${html.status}.`);
  }
  const pageStart = performance.now();
  const page = await fetch(`${base}/api/page/${pageId}`);
  await page.text();
  const pageMs = performance.now() - pageStart;
  if (!page.ok) {
    throw new Error(`GET /api/page/${pageId} answered ${page.status}.`);
  }
  return { htmlMs, pageMs, loadMs: htmlMs + pageMs };
}

async function timeSkeletonRebuild(run) {
  const statusFile = path.join(buildDirectory, 'buildStatus.json');
  const statusBefore = readFileOrNull(statusFile);
  const oldPid = findChildPid();
  editFile(path.join(configDirectory, 'lowdefy.yaml'), (text) =>
    text.replace(/^name: .*/m, `name: timed-skeleton-${run}`)
  );
  const start = performance.now();
  await waitFor(() => readFileOrNull(statusFile) !== statusBefore, {
    intervalMs: 5,
    label: 'the skeleton build',
  });
  const ms = performance.now() - start;
  // The config edit also restarts the child; wait for the new one so runs stay apart.
  await waitFor(
    async () => {
      const pid = findChildPid();
      return pid !== null && pid !== oldPid && (await ping(`http://127.0.0.1:${internalPort}`));
    },
    { intervalMs: 100, label: 'the child after the skeleton build' }
  );
  await sleep(1500);
  return ms;
}

// -- Run -----------------------------------------------------------------------------------

function load() {
  return os.loadavg()[0].toFixed(2);
}

const samples = {
  childStartMs: [],
  restartMs: [],
  appMapColdMs: [],
  appMapWarmMs: [],
  heapBeforeMb: [],
  heapAfterMb: [],
  pageHtmlMs: [],
  pagePageMs: [],
  pageLoadMs: [],
  skeletonMs: [],
};
const loads = {};

async function cleanup() {
  for (const { file, original } of restores.reverse()) {
    fs.writeFileSync(file, original);
  }
  if (args.attach === false) {
    await stopServer();
  }
}
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => cleanup().then(() => process.exit(1)));
}

try {
  const pageCount = fs.readdirSync(path.join(configDirectory, 'pages')).length;
  if (args.attach === false) {
    console.log(`Starting the dev server (load ${load()})...`);
    await startServer();
  }
  console.log(`Serving ${configDirectory} (${pageCount} page files), ${runs} runs each.`);

  loads.childAndAppMap = [];
  for (let run = 1; run <= runs; run++) {
    loads.childAndAppMap.push(load());
    const start = await timeChildStart();
    samples.childStartMs.push(start.childStartMs);
    samples.restartMs.push(start.restartMs);
    const appMap = await timeAppMap();
    samples.appMapColdMs.push(appMap.coldMs);
    samples.appMapWarmMs.push(...appMap.warmMs);
    samples.heapBeforeMb.push(appMap.heapBeforeMb);
    samples.heapAfterMb.push(appMap.heapAfterMb);
    console.log(
      `run ${run}: child start ${start.childStartMs.toFixed(
        0
      )} ms, app_map cold ${appMap.coldMs.toFixed(1)} ms, heap ${appMap.heapBeforeMb.toFixed(
        1
      )} -> ${appMap.heapAfterMb.toFixed(1)} MB`
    );
  }

  loads.pageLoad = [];
  for (let run = 1; run <= runs; run++) {
    loads.pageLoad.push(load());
    const result = await timePageLoad(pageIds[(run - 1) % pageIds.length], run);
    samples.pageHtmlMs.push(result.htmlMs);
    samples.pagePageMs.push(result.pageMs);
    samples.pageLoadMs.push(result.loadMs);
    console.log(
      `run ${run}: page html ${result.htmlMs.toFixed(0)} ms + page build ${result.pageMs.toFixed(
        0
      )} ms`
    );
    await sleep(500);
  }

  loads.skeleton = [];
  for (let run = 1; run <= runs; run++) {
    loads.skeleton.push(load());
    samples.skeletonMs.push(await timeSkeletonRebuild(run));
    console.log(`run ${run}: skeleton rebuild ${samples.skeletonMs.at(-1).toFixed(0)} ms`);
  }

  const rows = [
    ['child start (spawn -> ping)', samples.childStartMs, 'ms', loads.childAndAppMap],
    ['restart request -> child ping', samples.restartMs, 'ms', loads.childAndAppMap],
    ['app_map, first call on a new child', samples.appMapColdMs, 'ms', loads.childAndAppMap],
    ['app_map, warm calls', samples.appMapWarmMs, 'ms', loads.childAndAppMap],
    ['child heap before app_map (after GC)', samples.heapBeforeMb, 'MB', loads.childAndAppMap],
    ['child heap after app_map (after GC)', samples.heapAfterMb, 'MB', loads.childAndAppMap],
    ['page load: HTML', samples.pageHtmlMs, 'ms', loads.pageLoad],
    ['page load: JIT page build', samples.pagePageMs, 'ms', loads.pageLoad],
    ['page load: HTML + page build', samples.pageLoadMs, 'ms', loads.pageLoad],
    ['skeleton rebuild (edit -> built)', samples.skeletonMs, 'ms', loads.skeleton],
  ];
  const width = Math.max(...rows.map(([label]) => label.length));
  console.log(`\n${'timing'.padEnd(width)}  median      min      max   n  load(1m)`);
  for (const [label, values, unit, loadValues] of rows) {
    const digits = unit === 'MB' ? 1 : 1;
    console.log(
      `${label.padEnd(width)}  ${median(values).toFixed(digits).padStart(6)} ${unit}  ${Math.min(
        ...values
      )
        .toFixed(digits)
        .padStart(6)}  ${Math.max(...values)
        .toFixed(digits)
        .padStart(6)}  ${String(values.length).padStart(2)}  ${loadValues.join('/')}`
    );
  }
  if (args.json) {
    fs.writeFileSync(
      args.json,
      JSON.stringify({ configDirectory, pageCount, samples, loads }, null, 2)
    );
  }
} finally {
  await cleanup();
}
