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
import iconPackages from '../buildImports/iconPackages.js';

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

// createIcon renders the spinner for a loading icon and the exclamation for an
// icon name it cannot resolve, so every page module carries both.
const runtimeIcons = ['AiOutlineExclamationCircle', 'AiOutlineLoading3Quarters'];

function selectImports({ imports, typeNames }) {
  return imports.filter((imported) => typeNames.has(imported.typeName));
}

// The icon names a config fragment references, found the same way the app-wide
// barrel finds them — react-icons names are string values, not a type key.
function findIconNames(value) {
  const json = JSON.stringify(value ?? null);
  const names = new Set();
  Object.values(iconPackages).forEach((regex) => {
    [...json.matchAll(regex)].forEach((match) => names.add(match[1]));
  });
  return names;
}

// A block type may render icons its config never names — the block's meta
// declares them, and typesMap.icons carries them per type.
function findBlockDefaultIconNames({ blockTypeNames, context }) {
  const names = new Set();
  blockTypeNames.forEach((typeName) => {
    (context.typesMap.icons[typeName] ?? []).forEach((icon) => {
      findIconNames(icon).forEach((name) => names.add(name));
    });
  });
  return names;
}

// components.imports.icons is grouped by package and already validated against
// the installed react-icons packages, so selecting from it keeps a page module
// free of names that do not resolve. react-icons/io and io5 both export the
// IoIos* names; the first package wins, as it does in the app-wide barrel.
function selectIcons({ imports, iconNames }) {
  const selected = [];
  const seen = new Set();
  imports.forEach(({ icons, package: iconPackage }) => {
    icons.forEach((icon) => {
      if (!iconNames.has(icon) || seen.has(icon)) return;
      seen.add(icon);
      selected.push({ typeName: icon, originalTypeName: icon, package: iconPackage });
    });
  });
  return selected;
}

function pageImports({ components, iconNames, pageTypes }) {
  return {
    actions: selectImports({
      imports: components.imports.actions,
      typeNames: new Set([...pageTypes.actions, ...runtimeTypes.actions]),
    }),
    blocks: selectImports({
      imports: components.imports.blocks,
      typeNames: new Set([...pageTypes.blocks, ...runtimeTypes.blocks]),
    }),
    icons: selectIcons({ imports: components.imports.icons, iconNames }),
    operators: selectImports({
      imports: components.imports.operators.client,
      typeNames: new Set([...pageTypes.operators, ...runtimeTypes.operators]),
    }),
  };
}

// Per-page type imports: the client loads exactly the block components, client
// actions, client operators and icons one page renders with, so the bundler
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

  // The menus and the global object render on every page, so their icons are
  // part of every page's set.
  const sharedIconNames = new Set([
    ...runtimeIcons,
    ...findIconNames(components.global),
    ...findIconNames(components.menus),
  ]);

  await Promise.all(
    pages.map((page) => {
      const pageTypes = context.pageTypes[page.pageId];
      const iconNames = new Set([
        ...sharedIconNames,
        ...findIconNames(page),
        ...findBlockDefaultIconNames({ blockTypeNames: pageTypes.blocks, context }),
      ]);
      return context.writeBuildArtifact(
        `plugins/pages/${page.pageId}.js`,
        generatePageImportFile({
          artifactPath: `plugins/pages/${page.pageId}.js`,
          context,
          imports: pageImports({ components, iconNames, pageTypes }),
        })
      );
    })
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
