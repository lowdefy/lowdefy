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

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { createIdResolver, normalizePath } from 'vite';

// Vite's own tests for a bare import and for a file its optimiser pre-bundles.
const bareImportRe = /^(?![a-zA-Z]:)[\w@](?!.*:\/\/)/;
const optimizableFileRe = /\.[cm]?[jt]s$/;

function packageNameOf(id) {
  const parts = id.split('/');
  return id.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

function cleanUrl(url) {
  return url.replace(/[?#].*$/s, '');
}

// The installed package a resolved file belongs to, or null when the file is not inside an
// installed copy of that package (a linked package, or an alias that points elsewhere).
function packageDirOf(file, name) {
  const marker = `/node_modules/${name}/`;
  const index = file.lastIndexOf(marker);
  if (index === -1) return null;
  return file.slice(0, index + marker.length - 1);
}

// The dev server's dependency optimiser pre-bundles one copy of a package per bare import id,
// keyed by the id alone: the first importer its dependency scan meets decides which installed
// copy `react-markdown` is, and every other importer is served that copy. The scan runs in
// parallel, so which copy wins changes from one start to the next. When the source packages
// Vite serves (the Lowdefy packages of a Lowdefy checkout, linked plugins) depend on different
// versions of one package, some of them get the wrong one, where a production build bundles
// each importer's own copy.
//
// This keeps the plain id for the server's copy, the one the bare id resolves to from the
// server directory, and gives every other installed copy an id of its own,
// `<name>@<version>-<hash of its folder> > <id>`, in the form Vite gives nested dependencies.
// The id depends only on the copy, never on which importer the scan met first, so each start
// pre-bundles the same set, and importers that share a copy share its pre-bundle. Packages in
// resolve.dedupe always resolve to the server's copy and keep their plain id.
//
// It takes two plugins: `scanPlugin` goes in optimizeDeps.rolldownOptions.plugins, so the
// dependency scan records each copy under its own id, and `plugin` in the Vite plugins, to
// resolve those ids in the scan and to serve each importer its own copy's pre-bundle.
function prebundlePerPackageCopy() {
  let resolveFile;
  // The environment the dependency scan resolves in: the dev server's client environment, or
  // the scan environment of `vite optimize`, which the dev manager runs in a process of its own
  // before it starts Vite. The scan resolves its entry files through that environment's plugins
  // before it crawls their imports, so `plugin` meets it before scanPlugin needs it.
  let scanEnvironment;
  const copyFiles = new Map();
  const copyIds = new Map();

  async function findCopyId(environment, id, name, importer) {
    const file = await resolveFile(environment, id, importer);
    if (!file || !path.isAbsolute(file)) return null;
    const normalizedFile = normalizePath(cleanUrl(file));
    if (!optimizableFileRe.test(normalizedFile)) return null;
    const packageDir = packageDirOf(normalizedFile, name);
    if (!packageDir) return null;
    const serverFile = await resolveFile(environment, id);
    if (serverFile === file) return null;
    const { version } = JSON.parse(fs.readFileSync(path.join(packageDir, 'package.json'), 'utf8'));
    const hash = crypto.createHash('sha256').update(packageDir).digest('hex').slice(0, 8);
    const copyId = `${name}@${version}-${hash} > ${id}`;
    copyFiles.set(copyId, file);
    return copyId;
  }

  // The id the optimiser keeps the importer's copy under, or null for the plain id.
  function copyIdFor(environment, id, importer) {
    if (!importer || id.includes('?') || !bareImportRe.test(id)) return null;
    const importerFile = cleanUrl(importer);
    if (!path.isAbsolute(importerFile) || importerFile.includes('node_modules')) return null;
    const name = packageNameOf(id);
    if (environment.config.resolve.dedupe.includes(name)) return null;
    const cacheKey = `${id}\0${path.dirname(importerFile)}`;
    if (!copyIds.has(cacheKey)) {
      copyIds.set(cacheKey, findCopyId(environment, id, name, importerFile));
    }
    return copyIds.get(cacheKey);
  }

  const plugin = {
    name: 'lowdefy:prebundle-per-package-copy',
    enforce: 'pre',
    apply: 'serve',
    configResolved(config) {
      // Resolves without the optimiser, as Vite resolves optimizeDeps.include.
      resolveFile = createIdResolver(config, { asSrc: false, scan: true });
    },
    async resolveId(id, importer, options) {
      if (this.environment.config.consumer !== 'client') return null;
      if (options.scan) {
        scanEnvironment = this.environment;
        // The scan asks for the file of a copy id scanPlugin gave it.
        return copyFiles.get(id) ?? null;
      }
      const depsOptimizer = this.environment.depsOptimizer;
      if (!depsOptimizer) return null;
      const copyId = await copyIdFor(this.environment, id, importer);
      if (!copyId) return null;
      await depsOptimizer.scanProcessing;
      const { metadata } = depsOptimizer;
      const depInfo =
        metadata.optimized[copyId] ??
        metadata.discovered[copyId] ??
        metadata.chunks[copyId] ??
        depsOptimizer.registerMissingImport(copyId, copyFiles.get(copyId));
      return depsOptimizer.getOptimizedDepId(depInfo);
    },
  };

  const scanPlugin = {
    name: 'lowdefy:prebundle-per-package-copy-scan',
    async resolveId(id, importer, extraOptions) {
      if (!scanEnvironment) return null;
      const copyId = await copyIdFor(scanEnvironment, id, importer);
      if (!copyId) return null;
      // The scan records the dependency under the id it is asked to resolve. The optimiser's
      // bundle takes these plugins too; it never asks for a copy id (its importers are installed
      // packages), and if it did, the copy id would not resolve there and the import resolves as
      // before.
      return this.resolve(copyId, importer, { ...extraOptions, skipSelf: true });
    },
  };

  return { plugin, scanPlugin };
}

export default prebundlePerPackageCopy;
