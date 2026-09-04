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

import { ConfigError } from '@lowdefy/errors';

import filePluginDirectories from './filePluginDirectories.js';

// File plugins have no package to carry an identity, so every record shares
// this one. The watcher and the docs surfaces key off it.
const FILE_PLUGIN_PACKAGE_ID = 'file-plugin';

const pascalCase = /^[A-Z][A-Za-z0-9]*$/;

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

function isDirectory(absolutePath) {
  return fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory();
}

function readSiblingJson({ absolutePath, errors, relativePath, stem }) {
  const jsonPath = path.join(path.dirname(absolutePath), `${stem}.json`);
  if (!fs.existsSync(jsonPath)) {
    return {};
  }
  const jsonRelativePath = toPosix(path.join(path.dirname(relativePath), path.basename(jsonPath)));
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch (error) {
    errors.push(
      new ConfigError(`Could not parse ${jsonRelativePath}: ${error.message}`, {
        filePath: jsonRelativePath,
        lineNumber: 1,
      })
    );
    return {};
  }
  const sibling = {};
  if (parsed.meta !== undefined) sibling.meta = parsed.meta;
  if (parsed.schema !== undefined) sibling.schema = parsed.schema;
  if (parsed.hazards !== undefined) sibling.hazards = parsed.hazards;
  // A file plugin has no package.json to declare lowdefy.pluginApiVersion, so
  // the sibling JSON is where it declares one. Absent means the version this
  // framework implements: the file is written against the Lowdefy it sits in.
  if (parsed.pluginApiVersion !== undefined) sibling.pluginApiVersion = parsed.pluginApiVersion;
  return sibling;
}

function checkTypeName({ checkSlug, errors, naming, relativePath, typeClass, typeName }) {
  if (naming === 'operator' && !typeName.startsWith('_')) {
    errors.push(
      new ConfigError(
        `${typeClass} file plugin "${relativePath}" must be named starting with an underscore.`,
        { filePath: relativePath, lineNumber: 1, checkSlug }
      )
    );
    return false;
  }
  if (naming === 'PascalCase' && !pascalCase.test(typeName)) {
    errors.push(
      new ConfigError(`${typeClass} file plugin "${relativePath}" must be named in PascalCase.`, {
        filePath: relativePath,
        lineNumber: 1,
        checkSlug,
      })
    );
    return false;
  }
  return true;
}

/**
 * Walks the file-plugin directory convention under the config directory and
 * returns one record per type name it defines, in a deterministic order.
 *
 * Synchronous because createContext is synchronous and the typesMap it builds
 * must already contain the file plugins before the first build step runs.
 */
function discoverFilePlugins({ configDirectory }) {
  const records = [];
  const errors = [];
  if (!configDirectory || !isDirectory(path.join(configDirectory, 'plugins'))) {
    return { records, errors };
  }

  for (const {
    checkSlug,
    directory,
    extensions,
    kinds,
    naming,
    typeClass,
  } of filePluginDirectories) {
    const absoluteDirectory = path.join(configDirectory, ...directory.split('/'));
    if (!isDirectory(absoluteDirectory)) continue;

    const fileNames = fs
      .readdirSync(absoluteDirectory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && extensions.includes(path.extname(entry.name)))
      .map((entry) => entry.name)
      .sort();

    for (const fileName of fileNames) {
      const stem = path.basename(fileName, path.extname(fileName));
      // A plugin file name is a single-segment type name, so Card.test.jsx and
      // Card.stories.jsx are sources that live beside a plugin, not plugins.
      if (stem.includes('.')) continue;

      const relativePath = `${directory}/${fileName}`;
      if (!checkTypeName({ checkSlug, errors, naming, relativePath, typeClass, typeName: stem })) {
        continue;
      }

      const absolutePath = path.join(absoluteDirectory, fileName);
      const sibling = readSiblingJson({ absolutePath, errors, relativePath, stem });

      for (const kind of kinds) {
        records.push({
          kind,
          typeName: stem,
          originalTypeName: stem,
          typeClass,
          checkSlug,
          package: null,
          packageId: FILE_PLUGIN_PACKAGE_ID,
          version: null,
          file: absolutePath,
          relativePath,
          ...sibling,
        });
      }
    }
  }

  return { records, errors };
}

export { FILE_PLUGIN_PACKAGE_ID };
export default discoverFilePlugins;
