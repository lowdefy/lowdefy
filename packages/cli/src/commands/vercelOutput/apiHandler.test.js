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
import http from 'http';
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
const WebSocketClient = createRequire(path.join(serverDevDirectory, 'package.json'))('ws');

const app = `
import { Hono } from 'hono';
import { upgradeWebSocket } from '@hono/node-server';

export default function createApp(options) {
  const app = new Hono();
  app.get('/options', (c) => c.json(options));
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
  app.get('/state', (c) => c.json(state));
  app.get('/stream', () =>
    new Response(
      tickingStream({
        chunks: Infinity,
        onDone: () => {},
        onCancel: () => {
          state.streamCancelled = true;
        },
      })
    )
  );
  app.post('/run', () =>
    new Response(
      tickingStream({
        chunks: 10,
        onDone: () => {
          state.runFinished = true;
        },
        onCancel: () => {
          state.runCancelled = true;
        },
      })
    )
  );
  app.get(
    '/api/origin',
    upgradeWebSocket((c) => ({
      onOpen(event, ws) {
        ws.send(new URL(c.req.url).origin);
      },
    }))
  );
  return app;
}

const state = { streamCancelled: false, runFinished: false, runCancelled: false };

function tickingStream({ chunks, onDone, onCancel }) {
  let timer;
  let sent = 0;
  return new ReadableStream({
    start(controller) {
      timer = setInterval(() => {
        controller.enqueue(new TextEncoder().encode('tick\\n'));
        sent += 1;
        if (sent === chunks) {
          clearInterval(timer);
          onDone();
          controller.close();
        }
      }, 30);
    },
    cancel() {
      clearInterval(timer);
      onCancel();
    },
  });
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

test('the function entry creates the app without static assets, taking the client address from x-real-ip', async () => {
  const response = await fetch(`${baseUrl}/options`);

  expect(await response.json()).toEqual({
    serveStaticAssets: false,
    clientAddressHeader: 'x-real-ip',
  });
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

async function readState() {
  return (await fetch(`${baseUrl}/state`)).json();
}

async function dropAfterFirstChunk({ method, path: requestPath }) {
  await new Promise((resolve, reject) => {
    const request = http.request(`${baseUrl}${requestPath}`, { method }, (response) => {
      response.once('data', () => {
        request.destroy();
        resolve();
      });
    });
    request.on('error', () => {});
    request.on('close', resolve);
    request.end();
    setTimeout(() => reject(new Error('No first chunk.')), 2000);
  });
}

async function waitFor(predicate, timeout = 2000) {
  const started = Date.now();
  while (!(await predicate())) {
    if (Date.now() - started > timeout) {
      return false;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return true;
}

test('the function entry stops reading a GET stream when its client disconnects', async () => {
  await dropAfterFirstChunk({ method: 'GET', path: '/stream' });

  expect(await waitFor(async () => (await readState()).streamCancelled)).toBe(true);
});

test('the function entry reads a POST response to the end after its client disconnects', async () => {
  await dropAfterFirstChunk({ method: 'POST', path: '/run' });

  expect(await waitFor(async () => (await readState()).runFinished)).toBe(true);
  expect((await readState()).runCancelled).toBe(false);
});

test('the function entry gives an upgrade request the forwarded protocol and host', async () => {
  const socket = new WebSocketClient(`${baseUrl.replace('http', 'ws')}/api/origin`, {
    headers: { 'x-forwarded-host': 'app.example.com', 'x-forwarded-proto': 'https' },
  });
  const origin = await new Promise((resolve, reject) => {
    socket.once('message', (data) => resolve(String(data)));
    socket.once('error', reject);
  });
  socket.close();

  expect(origin).toBe('https://app.example.com');
});
