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
import isReportsPluginDeclared from './isReportsPluginDeclared.js';

async function collectStaticBlocks({ components, context }) {
  const blocks = components.imports?.blocks ?? [];

  const blocksByPackage = {};
  for (const block of blocks) {
    (blocksByPackage[block.package] ??= []).push(block);
  }

  const staticBlocks = [];
  for (const [packageName, packageBlocks] of Object.entries(blocksByPackage)) {
    const packageMetas = await importPluginModule({ context, specifier: `${packageName}/metas` });
    for (const block of packageBlocks) {
      if (packageMetas?.[block.originalTypeName]?.static === true) {
        staticBlocks.push(block);
      }
    }
  }
  return staticBlocks;
}

// Emits build/plugins/blocksStatic.js — static imports of the report renderers
// (`{package}/static`) for every used block whose meta declares `static: true`.
// A generated file of static imports is what serverless file tracing can follow;
// a runtime-resolved import() would leave the renderers out of the deployed
// function.
//
// The file is always written (apiContext imports it statically, so it must
// resolve for every app), but its content is gated on the reports plugin: only
// an app that installs it imports the renderers. That preserves per-app
// tree-shaking twice over — a non-reports app never pulls a renderer server-side,
// and a reports app with no ECharts never imports echarts.
async function writeBlockStaticImports({ components, context }) {
  const staticBlocks = isReportsPluginDeclared({ context })
    ? await collectStaticBlocks({ components, context })
    : [];

  await context.writeBuildArtifact(
    'plugins/blocksStatic.js',
    generateImportFile({ imports: staticBlocks, importPath: 'static' })
  );
}

export default writeBlockStaticImports;
