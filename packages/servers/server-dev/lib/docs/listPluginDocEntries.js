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

import listPackageDocFiles from './listPackageDocFiles.js';
import readDocTitle from './readDocTitle.js';
import readPluginPackages from './readPluginPackages.js';
import resolvePluginDir from './resolvePluginDir.js';

// Type kinds a doc can be looked up by, singular as the core docs name them.
const TYPE_KINDS = {
  actions: 'action',
  agents: 'agent',
  blocks: 'block',
  connections: 'connection',
  notifications: 'notification',
  operators: 'operator',
  requests: 'request',
  websockets: 'websocket',
};

function readPackageVersion({ dir, fallback }) {
  const packageJson = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  return packageJson.version ?? fallback;
}

// A published plugin is installed inside node_modules; a local one links to a
// directory outside it.
function isLocalPluginDir({ dir }) {
  return !dir.split(path.sep).includes('node_modules');
}

// Docs shipped by the app's plugins, Lowdefy's own left out (the core docs
// cover them). Returns the entries, the directories whose doc files can change
// while the server runs, and each type's doc slug, keyed "kind:typeName".
function listPluginDocEntries() {
  const entries = [];
  const localDirs = [];
  const typeDocs = new Map();
  for (const plugin of readPluginPackages()) {
    if (plugin.package.startsWith('@lowdefy/')) {
      continue;
    }
    const dir = resolvePluginDir({ packageName: plugin.package });
    if (type.isNone(dir)) {
      continue;
    }
    const local = isLocalPluginDir({ dir });
    if (local) {
      localDirs.push(dir);
    }
    const base = {
      section: 'Plugins',
      source: local ? 'local-plugin' : 'plugin',
      package: plugin.package,
      version: readPackageVersion({ dir, fallback: plugin.version }),
    };
    const { readme, docs } = listPackageDocFiles({ dir });
    const packageSlug = `plugins/${plugin.package}`;
    if (!type.isNone(readme)) {
      entries.push({ ...base, slug: packageSlug, title: plugin.package, filePath: readme });
    }
    const docsByStem = new Map();
    for (const filePath of docs) {
      const stem = path.basename(filePath, '.md');
      const entry = {
        ...base,
        slug: `${packageSlug}/${stem}`,
        title: readDocTitle({ filePath, fallback: stem }),
        filePath,
      };
      docsByStem.set(stem.toLowerCase(), entry);
      entries.push(entry);
    }
    for (const [kinds, typeNames] of Object.entries(plugin.types)) {
      const kind = TYPE_KINDS[kinds];
      if (type.isUndefined(kind)) {
        continue;
      }
      for (const typeName of typeNames) {
        const typeEntry = docsByStem.get(typeName.toLowerCase());
        if (!type.isUndefined(typeEntry)) {
          typeEntry.kind = typeEntry.kind ?? kind;
          typeEntry.typeName = typeEntry.typeName ?? typeName;
          typeDocs.set(`${kind}:${typeName}`, typeEntry.slug);
        } else if (!type.isNone(readme)) {
          typeDocs.set(`${kind}:${typeName}`, packageSlug);
        }
      }
    }
  }
  return { entries, localDirs, typeDocs };
}

export default listPluginDocEntries;
