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

import path from 'node:path';
import { type } from '@lowdefy/helpers';

import listPackageDocFiles from './listPackageDocFiles.js';
import parseModuleSource from './parseModuleSource.js';
import readDocTitle from './readDocTitle.js';

// Docs of the app's modules: each README and docs/*.md, plus a generated page
// of the components, exports and vars its module.lowdefy.yaml declares.
// Returns the entries and the local module roots, whose doc files can change
// while the server runs.
function listModuleDocEntries({ modules }) {
  const entries = [];
  const localDirs = [];
  for (const moduleEntry of Object.values(modules ?? {})) {
    if (moduleEntry.isLocal) {
      localDirs.push(moduleEntry.moduleRoot);
    }
    const base = {
      section: 'Modules',
      source: 'module',
      ...parseModuleSource({ source: moduleEntry.source }),
    };
    const moduleSlug = `modules/${moduleEntry.id}`;
    const { readme, docs } = listPackageDocFiles({ dir: moduleEntry.moduleRoot });
    if (!type.isNone(readme)) {
      entries.push({
        ...base,
        slug: moduleSlug,
        title: readDocTitle({ filePath: readme, fallback: `${moduleEntry.id} module` }),
        filePath: readme,
      });
    }
    for (const filePath of docs) {
      const stem = path.basename(filePath, '.md');
      entries.push({
        ...base,
        slug: `${moduleSlug}/${stem}`,
        title: readDocTitle({ filePath, fallback: stem }),
        filePath,
      });
    }
    entries.push({
      ...base,
      slug: `${moduleSlug}/manifest`,
      title: `${moduleEntry.id} module: components, exports and vars`,
      moduleEntry,
    });
  }
  return { entries, localDirs };
}

export default listModuleDocEntries;
