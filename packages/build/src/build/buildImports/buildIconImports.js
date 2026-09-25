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

import { ConfigWarning } from '@lowdefy/errors';

import collectIconNames, { getIconNamePackages } from './collectIconNames.js';
import createUnknownDataIconWarning from './createUnknownDataIconWarning.js';
import getIconAliases from './getIconAliases.js';
import iconPackages from './iconPackages.js';
import validateIconAliases from './validateIconAliases.js';
import validateIconImports from './validateIconImports.js';

function getIconSources({ blocks, components, context }) {
  // Endpoints are scanned too: HTML built on the server (event messages,
  // notifications) reaches the client as data.
  const sources = [
    components.global ?? {},
    components.menus ?? [],
    components.pages ?? [],
    components.api ?? [],
  ];
  // buildJs has already replaced _js bodies with hashes, so HTML built in _js
  // (ag-grid cells, formatters, server routines) is only visible in the JS sources.
  sources.push(Object.values(context.jsMap.client ?? {}));
  sources.push(Object.values(context.jsMap.server ?? {}));
  blocks.forEach((block) => {
    sources.push(context.typesMap.icons[block.typeName] ?? []);
  });
  sources.push(components.theme?.icons?.include ?? []);
  return sources;
}

function warnUnknownIncludes({ aliases, context, include }) {
  include.forEach((name) => {
    if (Object.hasOwn(aliases, name) || getIconNamePackages(name).length > 0) return;
    context.handleWarning(
      new ConfigWarning(
        `theme.icons.include lists "${name}", which is neither an icon alias nor a react-icons name.`,
        { checkSlug: 'icons' }
      )
    );
  });
}

function warnUnknownDataIcons({ aliases, context, unknownDataIcons }) {
  unknownDataIcons.forEach((name) => {
    context.handleWarning(createUnknownDataIconWarning({ aliases, name }));
  });
}

// Aliases in use are emitted as extra keys of the generated icon map, so the
// client looks up "edit" exactly like "LuPencil". Dev JIT pages resolve the
// aliases this scan does not see, so dev and prod bundle the same names.
function buildIconImports({ blocks, components, context, defaults = {} }) {
  validateIconAliases({
    aliases: components.theme?.icons?.aliases ?? {},
    configKey: components.theme?.icons?.['~k'],
    context,
  });
  const aliases = getIconAliases({ components });

  const packageIcons = {};
  Object.keys(iconPackages).forEach((iconPackage) => {
    packageIcons[iconPackage] = new Set(defaults[iconPackage]);
  });
  const usedAliases = new Set();
  const unknownDataIcons = new Set();

  getIconSources({ blocks, components, context }).forEach((source) => {
    const found = collectIconNames({ json: JSON.stringify(source), aliases });
    Object.entries(found.packageIcons).forEach(([iconPackage, icons]) => {
      icons.forEach((icon) => packageIcons[iconPackage].add(icon));
    });
    found.aliasNames.forEach((name) => usedAliases.add(name));
    found.unknownDataIcons.forEach((name) => unknownDataIcons.add(name));
  });
  warnUnknownIncludes({ aliases, context, include: components.theme?.icons?.include ?? [] });
  warnUnknownDataIcons({ aliases, context, unknownDataIcons });

  usedAliases.forEach((name) => {
    getIconNamePackages(aliases[name]).forEach((iconPackage) => {
      packageIcons[iconPackage].add(aliases[name]);
    });
  });

  const iconImports = validateIconImports({
    iconImports: Object.entries(packageIcons).map(([iconPackage, icons]) => ({
      icons: [...icons],
      package: iconPackage,
    })),
    context,
  });

  const importedIcons = new Set(iconImports.flatMap(({ icons }) => icons));
  const iconAliases = {};
  [...usedAliases].sort().forEach((name) => {
    if (importedIcons.has(aliases[name])) {
      iconAliases[name] = aliases[name];
    }
  });

  return { iconAliases, iconImports };
}

export default buildIconImports;
