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

import readBuildArtifact from './readBuildArtifact.js';
import resolvePluginDir from './resolvePluginDir.js';

// The synthetic package identity discoverFilePlugins gives a plugin that is a
// file in the config directory rather than an installed package.
const FILE_PLUGIN_PACKAGE_ID = 'file-plugin';

// A file plugin has no package name, so list_types names it by its type and
// its path — accept either as the handle this tool is called with.
function filePluginDefinition({ name }) {
  const availableTypes = readBuildArtifact({ name: 'plugins/availableTypes.json' }) ?? {};
  const stores = [
    availableTypes.blocks,
    availableTypes.actions,
    availableTypes.operators?.client,
    availableTypes.operators?.server,
  ];
  for (const store of stores) {
    for (const [typeName, definition] of Object.entries(store ?? {})) {
      if (definition.packageId !== FILE_PLUGIN_PACKAGE_ID) continue;
      if (typeName === name || definition.relativePath === name) {
        return { definition, typeName };
      }
    }
  }
  return null;
}

// A file plugin's documentation is the "readme" field of its sibling JSON —
// there is no package to hold a README.md.
function filePluginDoc({ definition, typeName }) {
  const jsonPath = definition.file.replace(/\.[^./]+$/, '.json');
  const relativeJson = definition.relativePath.replace(/\.[^./]+$/, '.json');
  let readme;
  if (fs.existsSync(jsonPath)) {
    readme = JSON.parse(fs.readFileSync(jsonPath, 'utf8')).readme;
  }
  const result = { type: typeName, source: 'file plugin', file: definition.relativePath };
  if (type.isNone(readme)) {
    return {
      ...result,
      markdown: `No documentation for "${typeName}"; add a "readme" field to "${relativeJson}" beside the plugin.`,
    };
  }
  return { ...result, readme, markdown: readme };
}

// Local plugins have no doc convention — probe the common locations and
// return whatever markdown ships with the package.
function getPluginDoc({ packageName }) {
  const filePlugin = filePluginDefinition({ name: packageName });
  if (!type.isNone(filePlugin)) {
    return filePluginDoc(filePlugin);
  }
  const pluginDir = resolvePluginDir({ packageName });
  if (type.isNone(pluginDir)) {
    return null;
  }
  const sections = [];
  for (const readme of ['README.md', 'readme.md']) {
    const readmePath = path.join(pluginDir, readme);
    if (fs.existsSync(readmePath)) {
      sections.push(fs.readFileSync(readmePath, 'utf8'));
      break;
    }
  }
  for (const docsDir of ['docs', 'dist/docs']) {
    const dirPath = path.join(pluginDir, docsDir);
    if (!fs.existsSync(dirPath)) {
      continue;
    }
    for (const fileName of fs.readdirSync(dirPath).sort()) {
      if (fileName.endsWith('.md')) {
        sections.push(fs.readFileSync(path.join(dirPath, fileName), 'utf8'));
      }
    }
  }
  if (sections.length === 0) {
    return null;
  }
  return { package: packageName, markdown: sections.join('\n\n---\n\n') };
}

export default getPluginDoc;
