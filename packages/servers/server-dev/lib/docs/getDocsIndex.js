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

import fs from 'node:fs';
import path from 'node:path';
import { type } from '@lowdefy/helpers';

import getDocsManifest from './getDocsManifest.js';
import listModuleDocEntries from './listModuleDocEntries.js';
import listPackageDocFiles from './listPackageDocFiles.js';
import listPluginDocEntries from './listPluginDocEntries.js';
import readBuildArtifact from './readBuildArtifact.js';

// The build artifacts that change when the app's plugins change. The dev
// build leaves an artifact whose bytes are unchanged with its old mtime, so a
// config-only edit leaves their stats alone.
const PLUGIN_ARTIFACTS = [
  'plugins/availableTypes.json',
  'customTypesMap.json',
  'installedPluginPackages.json',
];

let coreEntries;
let index = null;
let indexKey = null;
let localDirs = [];
let modulesStat = null;
let modules = null;
let modulesKey = null;

// The core docs change only with a release, so their entries are read once.
function getCoreEntries() {
  if (!type.isUndefined(coreEntries)) {
    return coreEntries;
  }
  const manifest = getDocsManifest();
  if (type.isNone(manifest)) {
    coreEntries = [];
    return coreEntries;
  }
  coreEntries = manifest.docs.map((doc) => ({
    ...doc,
    source: 'core',
    package: '@lowdefy/docs-content',
    version: manifest.version,
    filePath: path.join(manifest.contentDir, doc.path),
  }));
  return coreEntries;
}

function statKey(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return `${stat.mtimeMs}:${stat.size}`;
  } catch {
    return 'none';
  }
}

// modules.json also holds what a config edit changes (resolved var values,
// page bodies), so only the parts the docs read are compared.
function readModules() {
  const stat = statKey(path.join(process.cwd(), 'build', 'modules.json'));
  if (stat === modulesStat) {
    return;
  }
  modulesStat = stat;
  modules = readBuildArtifact({ name: 'modules.json', deserialize: true }) ?? {};
  modulesKey = JSON.stringify(
    Object.values(modules).map((moduleEntry) => [
      moduleEntry.id,
      moduleEntry.source,
      moduleEntry.moduleRoot,
      moduleEntry.isLocal,
      moduleEntry.varDefs,
      moduleEntry.manifest?.name,
      moduleEntry.manifest?.description,
      moduleEntry.manifest?.exports,
      (moduleEntry.manifest?.components ?? []).map((item) => [item.id, item.description]),
    ])
  );
}

// Doc files of local plugins and modules can be added, removed or edited
// while the server runs.
function localDocsKey() {
  return localDirs
    .map((dir) => {
      const { readme, docs } = listPackageDocFiles({ dir });
      return [readme, ...docs]
        .filter((filePath) => !type.isNone(filePath))
        .map((filePath) => `${filePath}@${statKey(filePath)}`);
    })
    .join('|');
}

function createIndexKey() {
  readModules();
  const buildDirectory = path.join(process.cwd(), 'build');
  return [
    ...PLUGIN_ARTIFACTS.map((name) => statKey(path.join(buildDirectory, name))),
    modulesKey,
    localDocsKey(),
  ].join('\n');
}

function buildIndex() {
  const plugins = listPluginDocEntries();
  const moduleDocs = listModuleDocEntries({ modules });
  localDirs = [...plugins.localDirs, ...moduleDocs.localDirs];
  return {
    entries: [...getCoreEntries(), ...plugins.entries, ...moduleDocs.entries],
    typeDocs: plugins.typeDocs,
  };
}

// Every doc the app can use: the core docs, and the docs its own plugins and
// modules ship. Rebuilt on the first call after the plugins or modules change.
// The key of a rebuilt index names the local doc files the build found, so it
// is taken again after the build.
function getDocsIndex() {
  const key = createIndexKey();
  if (key === indexKey) {
    return index;
  }
  index = buildIndex();
  indexKey = createIndexKey();
  return index;
}

export default getDocsIndex;
