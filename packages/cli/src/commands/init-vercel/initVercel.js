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
import url from 'url';
import { readFile, writeFile } from '@lowdefy/node-utils';

// The Vercel function entry. Kept inline (not a template file) so it ships verbatim — a real
// api/index.js template would be transpiled by the CLI's swc build, stripping these comments.
const apiHandler = `/*
  Vercel Serverless Function entry for a Lowdefy (Hono) app — created by lowdefy init-vercel.

  The built client and public files are served from Vercel's CDN (vercel.json outputDirectory:
  dist/client); every other request is rewritten here and run through the Lowdefy Hono app
  (page rendering, /api/* requests, endpoints, auth, agents).

  Runs on the Node runtime (the app uses fs to read its build). The request body is buffered
  eagerly and a Web Request is built from it: Vercel's Node runtime does not drain a lazily-read
  body stream reliably, so a streaming adapter hangs on every request that has a body (POST).
*/

import path from 'node:path';
import { fileURLToPath } from 'node:url';

// The app reads its build artifacts relative to process.cwd(). On Vercel the function's cwd is the
// lambda root (e.g. /var/task), not this deploy directory, so point the cwd here before loading the
// app. The import is dynamic so it runs AFTER chdir — a static import is hoisted and would read
// files at the wrong cwd.
process.chdir(path.join(path.dirname(fileURLToPath(import.meta.url)), '..'));

const { default: createApp } = await import('../src/app.js');
const app = createApp({ serveStaticAssets: false });

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  const method = req.method || 'GET';

  // Buffer the body eagerly — see the note above.
  let body;
  if (method !== 'GET' && method !== 'HEAD') {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    if (chunks.length > 0) body = Buffer.concat(chunks);
  }

  const host = req.headers['x-forwarded-host'] ?? req.headers.host;
  const protocol = req.headers['x-forwarded-proto'] ?? 'https';
  const request = new Request(protocol + '://' + host + req.url, {
    method,
    headers: req.headers,
    body,
  });

  const response = await app.fetch(request);

  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  if (response.body) {
    const reader = response.body.getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  }
  res.end();
}
`;

async function initVercel({ context }) {
  context.logger.info('Initializing Vercel deployment.');

  const deployDir = path.join(context.directories.config, 'deploy');

  const installScript = await readFile(
    url.fileURLToPath(new URL('./vercel.install.sh', import.meta.url))
  );
  await writeFile(path.join(deployDir, 'vercel.install.sh'), installScript);
  context.logger.info("Created 'vercel.install.sh'.");

  const vercelJson = await readFile(url.fileURLToPath(new URL('./vercel.json', import.meta.url)));
  await writeFile(path.join(deployDir, 'vercel.json'), vercelJson);
  context.logger.info("Created 'vercel.json'.");

  await writeFile(path.join(deployDir, 'api', 'index.js'), apiHandler);
  context.logger.info("Created 'api/index.js'.");

  const readMe = await readFile(url.fileURLToPath(new URL('./README.md', import.meta.url)));
  await writeFile(path.join(deployDir, 'README.md'), readMe);
  context.logger.info("Created 'README.md'.");

  await context.sendTelemetry();
  context.logger.info({ spin: 'succeed' }, 'Vercel deployment initialized.');
}

export default initVercel;
