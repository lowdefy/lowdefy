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

import { execFile } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const serverDir = path.dirname(fileURLToPath(import.meta.url));
let root;

// Jest's resolver cannot load Vite (it uses package subpath imports), so the
// build runs in a child process that resolves vite and lightningcss the way
// `vite build` does from the server directory.
const buildScript = `
import fs from 'node:fs';
import path from 'node:path';
import { build, loadConfigFromFile } from 'vite';
const root = process.env.FIXTURE_ROOT;
const { config } = await loadConfigFromFile(
  { command: 'build', mode: 'production' },
  path.resolve('vite.config.js')
);
const outDir = path.join(root, 'dist');
await build({
  ...config,
  configFile: false,
  logLevel: 'silent',
  root,
  build: { ...config.build, outDir, rollupOptions: { input: path.join(root, 'main.js') } },
});
const assetsDir = path.join(outDir, 'assets');
for (const file of fs.readdirSync(assetsDir).filter((name) => name.endsWith('.css'))) {
  process.stdout.write(fs.readFileSync(path.join(assetsDir, file), 'utf8'));
}
`;

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lowdefy-server-css-'));
});

afterEach(() => {
  fs.rmSync(root, { recursive: true, force: true });
});

test('production client build keeps light-dark() colours as written', async () => {
  fs.writeFileSync(path.join(root, 'main.js'), "import './styles.css';");
  fs.writeFileSync(
    path.join(root, 'styles.css'),
    ':root { --fill: light-dark(#f0f1f2, #2e3136); }\n.tag { color: light-dark(#111111, #eeeeee); }\n'
  );
  const { stdout: css } = await promisify(execFile)(
    process.execPath,
    ['--input-type=module', '--eval', buildScript],
    { cwd: serverDir, env: { ...process.env, FIXTURE_ROOT: root } }
  );
  expect(css).toContain('--fill:light-dark(#f0f1f2,#2e3136)');
  expect(css).toContain('color:light-dark(#111,#eee)');
  expect(css).not.toContain('--lightningcss-');
}, 30000);
