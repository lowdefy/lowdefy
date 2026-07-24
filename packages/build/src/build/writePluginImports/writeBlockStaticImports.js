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

import generateImportFile from './generateImportFile.js';
import importPluginModule from './importPluginModule.js';

// The server renders static reports without a browser runtime, so it must only
// import the static renderers an app actually uses. `components.imports.blocks`
// already carries the dev/prod split (prod: usage-counted types; dev: all types
// of used packages), so we inherit it and filter down to the blocks whose meta
// declares `static: true`. The registry is keyed by typeName and each renderer
// is imported from the owning package's `/static` entry.
async function writeBlockStaticImports({ components, context }) {
  const blocks = components.imports.blocks ?? [];

  const blocksByPackage = {};
  for (const block of blocks) {
    if (!blocksByPackage[block.package]) {
      blocksByPackage[block.package] = [];
    }
    blocksByPackage[block.package].push(block);
  }

  const staticBlocks = [];
  for (const [packageName, packageBlocks] of Object.entries(blocksByPackage)) {
    const packageMetas = await importPluginModule({
      context,
      specifier: `${packageName}/metas`,
    });
    for (const block of packageBlocks) {
      const meta = packageMetas?.[block.originalTypeName];
      if (meta?.static === true) {
        staticBlocks.push(block);
      }
    }
  }

  await context.writeBuildArtifact(
    'plugins/blocksStatic.js',
    generateImportFile({
      imports: staticBlocks,
      importPath: 'static',
    })
  );
}

export default writeBlockStaticImports;
