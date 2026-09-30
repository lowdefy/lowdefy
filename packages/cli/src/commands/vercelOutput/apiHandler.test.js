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

import { execFileSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

import apiHandler from './apiHandler.js';

// The handler is generated source that chdirs and uses top-level await, so it runs in its own Node
// process, inside a stub server directory laid out as the function assembly lays it out. The stubs
// record the order they are reached in, and a stub Vercel request context records waitUntil.
const stubs = {
  'package.json': JSON.stringify({ type: 'module' }),
  'api/index.js': apiHandler,
  'src/app.js': `globalThis.calls.push('import app');
export default function createApp() {
  return { fetch: async () => new Response('ok') };
}`,
  // initSentryServer's own DSN and logger.sentry handling is tested in @lowdefy/server.
  'lib/server/sentry/initSentry.js': `export default function initSentryServer() {
  globalThis.calls.push('initSentryServer');
  return Boolean(process.env.SENTRY_DSN);
}`,
  'lib/server/log/createLogger.js': `export default function createLogger() {
  return { info: (message) => globalThis.calls.push('log: ' + message) };
}`,
  'node_modules/@sentry/node/package.json': JSON.stringify({
    name: '@sentry/node',
    type: 'module',
    main: 'index.js',
  }),
  'node_modules/@sentry/node/index.js': `export function flush() {
  globalThis.calls.push('Sentry.flush');
  return Promise.resolve(true);
}`,
  'run.js': `globalThis.calls = [];
globalThis[Symbol.for('@vercel/request-context')] = {
  get: () => ({ waitUntil: () => globalThis.calls.push('waitUntil') }),
};
const { default: handler } = await import('./api/index.js');
const res = {
  setHeader: () => {},
  write: () => {},
  end: () => globalThis.calls.push('response end'),
};
await handler({ method: 'GET', url: '/', headers: { host: 'localhost' } }, res);
process.stdout.write(JSON.stringify(globalThis.calls));`,
};

let serverDirectory;

beforeAll(() => {
  serverDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-api-handler-'));
  Object.entries(stubs).forEach(([file, content]) => {
    fs.mkdirSync(path.dirname(path.join(serverDirectory, file)), { recursive: true });
    fs.writeFileSync(path.join(serverDirectory, file), content);
  });
});

afterAll(() => {
  fs.rmSync(serverDirectory, { recursive: true, force: true });
});

function runHandler({ env }) {
  const { SENTRY_DSN, ...rest } = process.env;
  const output = execFileSync(process.execPath, ['run.js'], {
    cwd: serverDirectory,
    env: { ...rest, ...env },
  });
  return JSON.parse(output.toString());
}

test('apiHandler initialises Sentry before importing the app and flushes after the response when SENTRY_DSN is set', () => {
  expect(runHandler({ env: { SENTRY_DSN: 'https://key@sentry.example.com/1' } })).toEqual([
    'initSentryServer',
    'import app',
    'log: Sentry enabled: server',
    'response end',
    'Sentry.flush',
    'waitUntil',
  ]);
});

test('apiHandler does not enable, log or flush Sentry when SENTRY_DSN is not set', () => {
  expect(runHandler({ env: {} })).toEqual(['initSentryServer', 'import app', 'response end']);
});
