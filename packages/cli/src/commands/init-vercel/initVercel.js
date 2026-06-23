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
// `api/index.js` template would be transpiled by the CLI's swc build, stripping these comments.
const apiHandler = `/*
  Vercel Serverless Function entry for a Lowdefy (Hono) app — created by \`lowdefy init-vercel\`.

  The built client and public files are served from Vercel's CDN (see vercel.json
  \`outputDirectory: dist/client\`); every other request is rewritten to this function, which runs
  the Lowdefy Hono app (page rendering, /api/* requests, endpoints, auth, agents).

  \`serveStaticAssets: false\` skips the app's Node static middleware (the CDN owns those files).
  The app reads build/**, dist/client/.vite/manifest.json and package.json at runtime — vercel.json
  \`functions[].includeFiles\` bundles them into the function.
*/

import { handle } from 'hono/vercel';

import createApp from '../src/app.js';

export const config = { runtime: 'nodejs' };

export default handle(createApp({ serveStaticAssets: false }));
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
