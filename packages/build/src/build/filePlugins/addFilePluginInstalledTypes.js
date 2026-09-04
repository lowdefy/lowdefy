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
import { get, type } from '@lowdefy/helpers';

import { FILE_PLUGIN_PACKAGE_ID } from './discoverFilePlugins.js';

/**
 * Counts every discovered file plugin as a used type in dev builds.
 *
 * Dev page content is built JIT, so a type used only on a page is never counted
 * by the skeleton build; addInstalledTypes covers package types by adding
 * everything an installed package defines. A file plugin has no package to be
 * installed, so it needs the same treatment here or the generated barrels omit
 * it and the page renders an undefined type.
 */
function addFilePluginInstalledTypes({ components, context }) {
  for (const record of context.filePlugins ?? []) {
    const definition = get(context.typesMap, record.kind)?.[record.typeName];
    // A name a package already defines is a collision the build reports; the
    // package type owns the typesMap entry and the file is not imported.
    if (definition?.packageId !== FILE_PLUGIN_PACKAGE_ID) continue;
    const store = get(components.types, record.kind);
    if (type.isNone(store) || !type.isNone(store[record.typeName])) continue;
    store[record.typeName] = {
      originalTypeName: record.originalTypeName,
      package: null,
      packageId: FILE_PLUGIN_PACKAGE_ID,
      version: null,
      file: record.file,
      relativePath: record.relativePath,
      count: 0,
    };
  }
}

export default addFilePluginInstalledTypes;
