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
import path from 'path';
import { fileURLToPath } from 'url';

import compileDir from '../compileDir.js';
import { createScope } from '../runtime/index.js';

const pkgRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// Per-worker tmp root: jest workers are separate processes running their
// suites sequentially, so scoping by pid keeps one suite's cleanTmp from
// deleting another worker's in-flight case dirs.
const tmpRoot = path.join(pkgRoot, '.tmp', `worker-${process.pid}`);
const runtimePath = path.join(pkgRoot, 'src/runtime/index.js');

function makeTmpDir() {
  fs.mkdirSync(tmpRoot, { recursive: true });
  return fs.mkdtempSync(path.join(tmpRoot, 'case-'));
}

function cleanTmp() {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}

// Writes fixture files, compiles the graph, imports the entry module, and
// runs the factory — the end-to-end path every emitted feature is tested
// through.
async function compileAndRun({
  files,
  entry,
  vars = {},
  mode = 'errors',
  module = null,
  collectErrors = false,
  env,
}) {
  const dir = makeTmpDir();
  const configDir = path.join(dir, 'config');
  const outDir = path.join(dir, 'out');
  for (const [relPath, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(configDir, relPath)), { recursive: true });
    fs.writeFileSync(path.join(configDir, relPath), content);
  }
  const result = await compileDir({ configDir, outDir, entry, mode, runtimePath });
  const mod = await import(result.entryUrl);
  const errors = [];
  const scope = createScope({
    vars,
    module,
    importer: result.importer,
    file: entry,
    // The entry is on the chain from the start (walker buildRefs parity) —
    // a ref back to the entry is a cycle at the first inclusion.
    refChain: [entry],
    onError: collectErrors ? (e) => errors.push(e) : null,
    env,
  });
  const output = await mod.default(scope);
  return { output, result, mod, errors, configDir, outDir };
}

async function compileOnly({ files, entry, mode = 'errors' }) {
  const dir = makeTmpDir();
  const configDir = path.join(dir, 'config');
  const outDir = path.join(dir, 'out');
  for (const [relPath, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(configDir, relPath)), { recursive: true });
    fs.writeFileSync(path.join(configDir, relPath), content);
  }
  return compileDir({ configDir, outDir, entry, mode, runtimePath });
}

export { compileAndRun, compileOnly, cleanTmp, makeTmpDir };
