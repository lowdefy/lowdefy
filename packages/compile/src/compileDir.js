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
import { pathToFileURL } from 'url';
import { ConfigError } from '@lowdefy/errors';
import { writeFile } from '@lowdefy/node-utils';

import compileSource from './compileSource.js';

function outFileFor(cfgPath) {
  return `${cfgPath}.js`;
}

// Compiles a config file graph starting at `entry`, mirroring sources into
// `outDir` as ES modules. The module graph IS the ref graph: static cycles
// are detected here at compile time with the inclusion chain; dynamic-path
// cycles are caught at run time by the scope.refChain guard.
async function compileDir({ configDir, outDir, entry, mode = 'errors', runtimePath = null }) {
  const compiled = new Map(); // cfgPath -> { fileId, keyMap }
  const compiling = []; // chain stack for cycle reporting
  const refMap = {};
  const keyMap = {};

  async function compileOne(cfgPath) {
    if (compiled.has(cfgPath)) return;
    const cycleStart = compiling.indexOf(cfgPath);
    if (cycleStart !== -1) {
      const chain = [...compiling.slice(cycleStart), cfgPath].join(' -> ');
      throw new ConfigError(`Circular reference detected: ${chain}.`, { filePath: cfgPath });
    }
    compiling.push(cfgPath);
    try {
      const absPath = path.resolve(configDir, cfgPath);
      let source;
      try {
        source = fs.readFileSync(absPath, 'utf8');
      } catch (error) {
        throw new ConfigError(
          `Referenced file does not exist: "${cfgPath}". Resolved to: ${absPath}`,
          { filePath: compiling.at(-2) ?? cfgPath, cause: error }
        );
      }
      const fromDir = path.posix.dirname(cfgPath);
      // Tests resolve the runtime by relative path (jest cannot resolve the
      // package self-reference from generated files); production emission
      // keeps the bare '@lowdefy/compile/runtime' specifier.
      let runtimeSpecifier;
      if (runtimePath) {
        const outAbsDir = path.dirname(path.join(outDir, outFileFor(cfgPath)));
        let rel = path.relative(outAbsDir, runtimePath).split(path.sep).join('/');
        if (!rel.startsWith('.')) rel = `./${rel}`;
        runtimeSpecifier = rel;
      }
      const result = compileSource({
        source,
        file: cfgPath,
        mode,
        configDir,
        runtimeSpecifier,
        // Missing static refs emit a collected-error call (walker parity)
        // instead of an import that would fail the whole compile.
        refExists: (refPath) => fs.existsSync(path.resolve(configDir, refPath)),
        resolveImport: (refPath) => {
          let specifier = path.posix.relative(fromDir === '.' ? '' : fromDir, outFileFor(refPath));
          if (!specifier.startsWith('.')) specifier = `./${specifier}`;
          return specifier;
        },
      });
      await writeFile(path.join(outDir, outFileFor(cfgPath)), result.code);
      refMap[result.fileId] = { path: cfgPath };
      Object.assign(keyMap, result.keyMap);
      for (const refPath of result.staticRefs) {
        await compileOne(refPath);
      }
      // Marked complete only after the subtree compiled — a revisit while
      // still on the `compiling` stack is a cycle, not a cache hit.
      compiled.set(cfgPath, { fileId: result.fileId });
    } finally {
      compiling.pop();
    }
  }

  await compileOne(entry);

  return {
    entry,
    entryUrl: pathToFileURL(path.join(outDir, outFileFor(entry))).href,
    files: [...compiled.keys()],
    keyMap,
    refMap,
    // Importer for dynamic (operator-built) ref paths — maps a config path to
    // its compiled module, compiling on demand if the static graph missed it.
    importer: async (cfgPath) => {
      if (!compiled.has(cfgPath)) {
        await compileOne(cfgPath);
      }
      return import(pathToFileURL(path.join(outDir, outFileFor(cfgPath))).href);
    },
  };
}

export default compileDir;
