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
import { type } from '@lowdefy/helpers';

import listPackageDocFiles from './listPackageDocFiles.js';
import readBuildArtifact from './readBuildArtifact.js';
import readPluginPackages from './readPluginPackages.js';
import resolvePluginDir from './resolvePluginDir.js';

// The package name comes from the caller, and a name such as "../../x" would
// resolve outside node_modules, so only the app's own plugins are read.
function isAppPlugin({ packageName }) {
  const installed = readBuildArtifact({ name: 'installedPluginPackages.json' }) ?? [];
  if (installed.includes(packageName)) {
    return true;
  }
  return readPluginPackages().some((plugin) => plugin.package === packageName);
}

// Every markdown file a plugin package ships, joined into one document.
function getPluginDoc({ packageName }) {
  if (!isAppPlugin({ packageName })) {
    return null;
  }
  const pluginDir = resolvePluginDir({ packageName });
  if (type.isNone(pluginDir)) {
    return null;
  }
  const { readme, docs } = listPackageDocFiles({ dir: pluginDir });
  const files = type.isNone(readme) ? docs : [readme, ...docs];
  if (files.length === 0) {
    return null;
  }
  const sections = files.map((filePath) => fs.readFileSync(filePath, 'utf8'));
  return { package: packageName, markdown: sections.join('\n\n---\n\n') };
}

export default getPluginDoc;
