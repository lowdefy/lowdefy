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
import http from 'http';
import os from 'os';
import path from 'path';

import verifyServer from './verifyServer.js';

const buildDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-e2e-build-'));
const servers = [];

async function startServer({ status, body, contentType = 'application/json', onlyPath }) {
  const server = http.createServer((req, res) => {
    if (onlyPath && req.url !== onlyPath) {
      res.writeHead(404, { 'content-type': 'text/html' });
      res.end('<html></html>');
      return;
    }
    res.writeHead(status, { 'content-type': contentType });
    res.end(typeof body === 'string' ? body : JSON.stringify(body));
  });
  await new Promise((resolve) => server.listen(0, resolve));
  servers.push(server);
  return server.address().port;
}

afterAll(async () => {
  await Promise.all(servers.map((server) => new Promise((resolve) => server.close(resolve))));
  fs.rmSync(buildDir, { recursive: true });
});

test('verifyServer accepts the e2e server that serves this build directory', async () => {
  const port = await startServer({
    status: 200,
    body: { server: 'lowdefy-e2e', buildDirectory: fs.realpathSync(buildDir) },
  });
  await expect(verifyServer({ buildDir, port })).resolves.toBeUndefined();
});

test('verifyServer asks for the identity under the basePath the build records', async () => {
  const basePathBuildDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-e2e-build-'));
  fs.writeFileSync(
    path.join(basePathBuildDir, 'config.json'),
    JSON.stringify({ basePath: '/shop' })
  );
  const port = await startServer({
    status: 200,
    body: { server: 'lowdefy-e2e', buildDirectory: fs.realpathSync(basePathBuildDir) },
    onlyPath: '/shop/api/e2e/identity',
  });
  await expect(verifyServer({ buildDir: basePathBuildDir, port })).resolves.toBeUndefined();
  fs.rmSync(basePathBuildDir, { recursive: true });
});

test('verifyServer rejects the e2e server of another app or checkout', async () => {
  const port = await startServer({
    status: 200,
    body: { server: 'lowdefy-e2e', buildDirectory: '/other/checkout/.lowdefy/server/build' },
  });
  await expect(verifyServer({ buildDir, port })).rejects.toThrow(
    `Port ${port} is in use by the Lowdefy e2e server of another app or checkout, which serves /other/checkout/.lowdefy/server/build.`
  );
});

test.each([
  [
    'a 404 page, like lowdefy dev',
    { status: 404, body: '<html></html>', contentType: 'text/html' },
  ],
  ['an HTML fallback page', { status: 200, body: '<html></html>', contentType: 'text/html' }],
  ['JSON from another server', { status: 200, body: { user: null } }],
])('verifyServer rejects a server that answers with %s', async (_, response) => {
  const port = await startServer(response);
  await expect(verifyServer({ buildDir, port })).rejects.toThrow(
    `Port ${port} is in use by a server that is not a Lowdefy e2e server (/api/e2e/identity did not answer as one)`
  );
});

test('verifyServer names the port when no server answers', async () => {
  const port = await startServer({ status: 200, body: {} });
  await new Promise((resolve) => servers.pop().close(resolve));
  await expect(verifyServer({ buildDir, port })).rejects.toThrow(
    `Could not reach the e2e server on port ${port}`
  );
});
