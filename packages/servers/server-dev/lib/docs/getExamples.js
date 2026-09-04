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

const EXAMPLE_FILES = ['gallery.yaml', 'examples.yaml', 'tests.yaml'];

// The synthetic package identity discoverFilePlugins gives a plugin that is a
// file in the config directory rather than an installed package.
const FILE_PLUGIN_PACKAGE_ID = 'file-plugin';

// A file plugin's examples sit beside the plugin, named after it, and the
// build knows the absolute path it was discovered at.
function filePluginDefinition({ availableTypes, typeName }) {
  const stores = [
    availableTypes.blocks,
    availableTypes.actions,
    availableTypes.operators?.client,
    availableTypes.operators?.server,
  ];
  for (const store of stores) {
    const definition = store?.[typeName];
    if (definition?.packageId === FILE_PLUGIN_PACKAGE_ID) {
      return definition;
    }
  }
  return null;
}

function filePluginExamples({ definition, typeName }) {
  const stem = path.basename(definition.file, path.extname(definition.file));
  const examplesPath = path.join(path.dirname(definition.file), `${stem}.examples.yaml`);
  const result = { type: typeName, source: 'file plugin', file: definition.relativePath };
  if (!fs.existsSync(examplesPath)) {
    const relativeExamples = definition.relativePath.replace(/\.[^./]+$/, '.examples.yaml');
    return {
      ...result,
      note: `No examples file for "${typeName}"; add "${relativeExamples}" beside the plugin. It holds a list of { title, blocks } entries, the same shape a plugin package's examples.yaml uses.`,
    };
  }
  return { ...result, files: { 'examples.yaml': fs.readFileSync(examplesPath, 'utf8') } };
}

// Block example yaml ships in plugin dist by convention
// (dist/blocks/<Block>/gallery.yaml). Local plugins may only ship some of
// these files, or none — return whatever exists, never throw.
function getExamples({ type: typeName }) {
  const availableTypes = readBuildArtifact({ name: 'plugins/availableTypes.json' }) ?? {};
  const filePlugin = filePluginDefinition({ availableTypes, typeName });
  if (!type.isNone(filePlugin)) {
    return filePluginExamples({ definition: filePlugin, typeName });
  }
  const definition = availableTypes.blocks?.[typeName];
  if (type.isNone(definition)) {
    return null;
  }
  const pluginDir = resolvePluginDir({ packageName: definition.package });
  if (type.isNone(pluginDir)) {
    return null;
  }
  const files = {};
  for (const baseDir of ['dist/blocks', 'src/blocks', 'blocks']) {
    const blockDir = path.join(pluginDir, baseDir, definition.originalTypeName);
    for (const fileName of EXAMPLE_FILES) {
      const filePath = path.join(blockDir, fileName);
      if (!files[fileName] && fs.existsSync(filePath)) {
        files[fileName] = fs.readFileSync(filePath, 'utf8');
      }
    }
    if (Object.keys(files).length > 0) {
      break;
    }
  }
  if (Object.keys(files).length === 0) {
    return null;
  }
  return { type: typeName, package: definition.package, files };
}

export default getExamples;
