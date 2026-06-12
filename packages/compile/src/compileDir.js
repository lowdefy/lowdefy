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

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { ConfigError } from '@lowdefy/errors';
import { writeFile } from '@lowdefy/node-utils';

import compileSource from './compileSource.js';

// Module files are keyed by absolute path (matching walker refMap paths);
// their emitted modules mirror under __abs__/ inside outDir.
function outFileFor(cfgPath) {
  if (cfgPath.startsWith('/')) {
    return path.posix.join('__abs__', cfgPath.slice(1)) + '.js';
  }
  return `${cfgPath}.js`;
}

// Compiles a config file graph starting at `entry`, mirroring sources into
// `outDir` as ES modules. The module graph IS the ref graph. Import cycles
// are legal at the module level (factories only touch their imports when
// called) — circular CONFIG inclusion is caught at run time by the
// scope.refChain guard, which reproduces the walker's error and null
// placement exactly.
async function compileDir({
  configDir,
  outDir,
  entry,
  mode = 'errors',
  runtimePath = null,
  resolveModuleExport = null,
  // D7b: preserve zones apply to the ENTRY file only (manifest compiles);
  // entryModuleRoot compiles the entry with module-root path prefixing.
  entryPreserveZones = null,
  entryCollectFactoryExports = null,
  entryModuleRoot = null,
  // Global refResolver (build option): every path ref emits as a resolver
  // call — content comes from the user function, not the filesystem.
  refResolver = null,
}) {
  const compiled = new Map(); // cfgPath -> { fileId, keyMap }
  const compiling = []; // in-progress stack (cycle edges return early)
  const refMap = {};
  const keyMap = {};

  async function compileOne(cfgPath, fileModuleRoot = null) {
    if (compiled.has(cfgPath)) return;
    if (compiling.includes(cfgPath)) {
      // Already being compiled higher up the stack — its module file is
      // written before its refs recurse, so the import will resolve.
      return;
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
      // Import specifiers are relative in OUT space — module files mirror
      // under __abs__/, so source-dir relativity does not hold.
      const fromDir = path.posix.dirname(outFileFor(cfgPath));
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
        moduleRoot: fileModuleRoot,
        resolveModuleExport,
        refResolver,
        preserveZones: cfgPath === entry ? entryPreserveZones : null,
        collectFactoryExports: cfgPath === entry ? entryCollectFactoryExports : null,
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
        // Refs inside a module file are emitted module-root-joined already —
        // the target compiles under the same root.
        await compileOne(refPath, fileModuleRoot);
      }
      for (const moduleImport of result.moduleImports ?? []) {
        await compileOne(moduleImport.path, moduleImport.moduleRoot);
      }
      // Marked complete only after the subtree compiled — a revisit while
      // still on the `compiling` stack is a cycle, not a cache hit.
      compiled.set(cfgPath, { fileId: result.fileId });
    } finally {
      compiling.pop();
    }
  }

  // Runtime source compile for resolver-returned YAML text: content varies
  // per call (resolvers interpolate vars), so virtual modules key by content
  // hash; the fileId stays the label (the ref's path) for stable lexical ids.
  // Nested static refs inside the content compile into the same graph, and
  // keyMap/refMap additions land in the same (already returned) objects.
  const virtualCompiled = new Map();
  async function importSource(source, label) {
    const hash = crypto.createHash('sha1').update(source).digest('hex').slice(0, 20);
    const outRel = path.posix.join('__virtual__', `${hash}.js`);
    if (!virtualCompiled.has(hash)) {
      let runtimeSpecifier;
      if (runtimePath) {
        const outAbsDir = path.dirname(path.join(outDir, outRel));
        let rel = path.relative(outAbsDir, runtimePath).split(path.sep).join('/');
        if (!rel.startsWith('.')) rel = `./${rel}`;
        runtimeSpecifier = rel;
      }
      const result = compileSource({
        source,
        file: label,
        mode,
        configDir,
        resolveModuleExport,
        refResolver,
        runtimeSpecifier,
        refExists: (refPath) => fs.existsSync(path.resolve(configDir, refPath)),
        resolveImport: (refPath) => {
          let specifier = path.posix.relative('__virtual__', outFileFor(refPath));
          if (!specifier.startsWith('.')) specifier = `./${specifier}`;
          return specifier;
        },
      });
      await writeFile(path.join(outDir, outRel), result.code);
      refMap[result.fileId] = { path: label };
      Object.assign(keyMap, result.keyMap);
      for (const refPath of result.staticRefs) {
        await compileOne(refPath);
      }
      virtualCompiled.set(hash, outRel);
    }
    return import(pathToFileURL(path.join(outDir, virtualCompiled.get(hash))).href);
  }

  await compileOne(entry, entryModuleRoot);

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
    importSource,
  };
}

export default compileDir;
