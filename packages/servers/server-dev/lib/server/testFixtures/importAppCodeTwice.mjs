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

// Run by importAppCode.test.mjs in its own process: Jest can load neither Vite
// nor a module URL with a query. Loads the build's importAppCode the way the dev
// server's JIT page builds do, then imports an app code file, imports it again
// unchanged, edits it and imports it again. With `vite`, through Vite's SSR
// module runner (@lowdefy/build linked, as in the monorepo); with `node`,
// natively (@lowdefy/build installed from npm, which Vite externalises).
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { createServer } from 'vite';

const [loader, configDir] = process.argv.slice(2);
const require = createRequire(import.meta.url);
const serverDevDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');

const buildDevEntry = require.resolve('@lowdefy/build/dev');
const modulePath = path.join(path.dirname(buildDevEntry), 'utils/createImportAppCode.js');

let server = null;
if (loader === 'vite') {
  server = await createServer({
    configFile: false,
    root: serverDevDir,
    logLevel: 'error',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, watch: null },
  });
}

try {
  const { default: createImportAppCode } = server
    ? await server.ssrLoadModule(modulePath)
    : await import(pathToFileURL(modulePath).href);
  const importAppCode = createImportAppCode({ directories: { config: configDir } });
  const filePath = path.join(configDir, 'transformer.js');

  fs.writeFileSync(filePath, "export default () => 'before';\n");
  const first = await importAppCode('transformer.js');
  const unchanged = await importAppCode('transformer.js');
  fs.writeFileSync(filePath, "export default () => 'after';\n");
  const edited = await importAppCode('transformer.js');

  process.stdout.write(
    JSON.stringify({
      first: first(),
      edited: edited(),
      unchangedReused: unchanged === first,
    })
  );
} finally {
  await server?.close();
}
