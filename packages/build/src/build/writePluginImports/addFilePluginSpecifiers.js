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
import { LowdefyInternalError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import filePluginImportSpecifier from '../filePlugins/filePluginImportSpecifier.js';
import findFilePlugin from '../filePlugins/findFilePlugin.js';

// A package plugin is reached through its package subpath barrel; a file plugin
// has no package, so it is reached by path — the file in place in dev, the copy
// under the server directory in prod — and it exports the type as its default.
function addFilePluginSpecifiers({ artifactPath, context, imports, kind }) {
  return (imports ?? []).map((imported) => {
    if (!type.isNone(imported.package)) {
      return imported;
    }
    const record = findFilePlugin({ context, kind, typeName: imported.typeName });
    if (type.isNone(record)) {
      // Every type with no package is a discovered file plugin: buildImports
      // reads the same typesMap discovery wrote into.
      throw new LowdefyInternalError(
        `No file plugin was discovered for ${kind} type "${imported.typeName}".`
      );
    }
    return {
      ...imported,
      filePluginSpecifier: filePluginImportSpecifier({ artifactPath, context, record }),
    };
  });
}

export default addFilePluginSpecifiers;
