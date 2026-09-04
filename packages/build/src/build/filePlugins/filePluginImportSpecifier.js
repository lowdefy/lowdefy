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

import filePluginTargetPath from './filePluginTargetPath.js';

function toPosix(filePath) {
  return filePath.split(path.sep).join('/');
}

/**
 * The import specifier a generated barrel uses to reach a file plugin.
 *
 * A file plugin has no package name, so the specifier is a path relative to the
 * barrel that holds it — artifactPath is that barrel's path under the build
 * directory, e.g. 'plugins/blocks.js' or 'plugins/operators/client.js'.
 */
function filePluginImportSpecifier({ artifactPath, context, record }) {
  const artifactDirectory = path.dirname(path.resolve(context.directories.build, artifactPath));
  const specifier = toPosix(
    path.relative(artifactDirectory, filePluginTargetPath({ context, record }))
  );
  if (specifier.startsWith('.')) {
    return specifier;
  }
  return `./${specifier}`;
}

export default filePluginImportSpecifier;
