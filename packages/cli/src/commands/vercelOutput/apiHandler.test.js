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

import { spawn } from 'child_process';
import fs from 'fs';
import net from 'net';
import os from 'os';
import path from 'path';
import { createRequire } from 'module';

import apiHandler from './apiHandler.js';

// Runs the generated function entry in its own process against a small Hono
// app, the way Vercel runs it: the entry's default export is a Node HTTP
// server. hono, @hono/node-server and ws resolve from the dev server package,
// which installs the same versions as the production server.
const require = createRequire(import.meta.url);
const serverDevDirectory = path.dirname(require.resolve('@lowdefy/server-dev/package.json'));

const app = `
import { Hono } from 'hono';
import { upgradeWebSocket } from '@hono/node-server';

export default function createApp() {
  const app = new Hono();
  app.post('/echo', async (c) => c.json(await c.req.json()));
  app.get('/sign-in', (c) => {
    c.header('set-cookie', 'session=abc; Path=/; HttpOnly', { append: true });
    c.header('set-cookie', 'state=; Path=/; Max-Age=0', { append: true });
    return c.text('ok');
  });
  app.get(
    '/api/websocket',
    upgradeWebSocket(() => ({
      onMessage(event, ws) {
        ws.send('echo ' + event.data);
      },
    }))
  );
  return app;
}
`;

const runner = `
const { default: server } = await import(process.argv[1]);
server.listen(0, '127.0.0.1', () => console.log(server.address().port));
`;

let serverDirectory;
let child;
let baseUrl;
let exited;

beforeAll(async () => {
  serverDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-vercel-entry-test-'));
  fs.mkdirSync(path.join(serverDirectory, 'src'));
  fs.mkdirSync(path.join(serverDirectory, 'api'));
  fs.writeFileSync(path.join(serverDirectory, 'package.json'), '{"type":"module"}');
  fs.writeFileSync(path.join(serverDirectory, 'src', 'app.js'), app);
  fs.writeFileSync(path.join(serverDirectory, 'api', 'index.js'), apiHandler);
  fs.symlinkSync(
    path.join(serverDevDirectory, 'node_modules'),
    path.join(serverDirectory, 'node_modules'),
    'junction'
  );

  child = spawn(
    process.execPath,
    ['--input-type=module', '-e', runner, path.join(serverDirectory, 'api', 'index.js')],
    { stdio: ['ignore', 'pipe', 'pipe'] }
  );
  exited = new Promise((resolve) => child.once('exit', resolve));
  const port = await new Promise((resolve, reject) => {
    child.stdout.once('data', (data) => resolve(Number(String(data).trim())));
    child.once('exit', (code) => reject(new Error(`The function entry exited with ${code}.`)));
  });
  baseUrl = `http://127.0.0.1:${port}`;
});

afterAll(async () => {
  if (child.exitCode === null) {
    child.kill();
    await exited;
  }
  fs.rmSync(serverDirectory, { recursive: true, force: true });
});

test('the function entry runs a POST with its body', async () => {
  const response = await fetch(`${baseUrl}/echo`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ hello: 'world' }),
  });

  expect(await response.json()).toEqual({ hello: 'world' });
});

test('the function entry sends every Set-Cookie header a response sets', async () => {
  const response = await fetch(`${baseUrl}/sign-in`);

  expect(response.headers.getSetCookie()).toEqual([
    'session=abc; Path=/; HttpOnly',
    'state=; Path=/; Max-Age=0',
  ]);
});

test('the function entry accepts a websocket upgrade', async () => {
  const socket = new WebSocket(`${baseUrl.replace('http', 'ws')}/api/websocket`);
  const reply = await new Promise((resolve, reject) => {
    socket.addEventListener('open', () => socket.send('ping'));
    socket.addEventListener('message', (event) => resolve(event.data));
    socket.addEventListener('error', () => reject(new Error('WebSocket failed.')));
  });
  socket.close();

  expect(reply).toBe('echo ping');
});

test('the function entry keeps serving after a client drops a request mid-body', async () => {
  await new Promise((resolve) => {
    const socket = net.connect(new URL(baseUrl).port, '127.0.0.1', () => {
      socket.write(
        'POST /echo HTTP/1.1\r\nHost: 127.0.0.1\r\nContent-Type: application/json\r\nContent-Length: 100\r\n\r\n{"a":'
      );
      setTimeout(() => {
        socket.destroy();
        resolve();
      }, 50);
    });
  });
  await new Promise((resolve) => setTimeout(resolve, 200));

  expect(child.exitCode).toBe(null);
  const response = await fetch(`${baseUrl}/echo`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ after: 'drop' }),
  });
  expect(await response.json()).toEqual({ after: 'drop' });
});
