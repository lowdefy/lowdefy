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
import basicTypes from '@lowdefy/blocks-basic/types';
import loaderTypes from '@lowdefy/blocks-loaders/types';

import generatePageImportFile from './generatePageImportFile.js';

// The client shell renders Message and the progress bar, loaders render
// skeletons while a block's request runs, form validation evaluates _not and
// _type, and the antd menus dispatch SetDarkMode. buildTypes counts these into
// every app rather than into any one page, so every page module carries them —
// the bundler hoists the set into one shared chunk.
const runtimeTypes = {
  actions: ['SetDarkMode'],
  blocks: ['Message', ...basicTypes.blocks, ...loaderTypes.blocks],
  operators: ['_not', '_type'],
};

function selectImports({ imports, typeNames }) {
  return imports.filter((imported) => typeNames.has(imported.typeName));
}

function pageImports({ components, pageTypes }) {
  return {
    actions: selectImports({
      imports: components.imports.actions,
      typeNames: new Set([...pageTypes.actions, ...runtimeTypes.actions]),
    }),
    blocks: selectImports({
      imports: components.imports.blocks,
      typeNames: new Set([...pageTypes.blocks, ...runtimeTypes.blocks]),
    }),
    operators: selectImports({
      imports: components.imports.operators.client,
      typeNames: new Set([...pageTypes.operators, ...runtimeTypes.operators]),
    }),
  };
}

// Per-page type imports: the client loads exactly the block components, client
// actions and client operators one page renders with, so the bundler
// code-splits the plugin packages per page instead of shipping every type in
// the app's main chunk. The full barrels stay as the client's fallback for a
// type a page module lacks (a JIT dev page, an unbuilt page, or a type that
// only appears at page-get time).
//
// Prod only: the dev server builds pages just in time, so a dev page's type
// set is not known when the client bundle is served.
async function writePageImports({ components, context }) {
  const enabled =
    context.stage === 'prod' && components.config?.experimental?.perPageImports !== false;
  const pages = enabled ? components.pages ?? [] : [];

  await Promise.all(
    pages.map((page) =>
      context.writeBuildArtifact(
        `plugins/pages/${page.pageId}.js`,
        generatePageImportFile({
          artifactPath: `plugins/pages/${page.pageId}.js`,
          context,
          imports: pageImports({ components, pageTypes: context.pageTypes[page.pageId] }),
        })
      )
    )
  );

  // Written even when the split is off, as an empty map: the client imports it
  // statically and reads a miss as "use the full barrels".
  const entries = pages.map(
    (page) =>
      `  ${JSON.stringify(page.pageId)}: () => import(${JSON.stringify(`./${page.pageId}.js`)}),`
  );
  await context.writeBuildArtifact(
    'plugins/pages/index.js',
    `export default {\n${entries.join('\n')}${entries.length > 0 ? '\n' : ''}};\n`
  );
}

export default writePageImports;
