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

import alwaysBundledIcons from '../icons/alwaysBundledIcons.js';
import resolveIconName from '../icons/resolveIconName.js';
import validateIconNames from '../icons/validateIconNames.js';
import collectIconNames from './collectIconNames.js';

function getConfigTexts({ components, context }) {
  // Endpoints are scanned too: HTML built on the server (event messages,
  // notifications) reaches the client as data. buildJs has already replaced
  // _js bodies with hashes, so names used in _js code (ag-grid cells,
  // formatters, server routines) are only visible in the JS sources.
  return [
    JSON.stringify(components.global ?? {}),
    JSON.stringify(components.menus ?? []),
    JSON.stringify(components.pages ?? []),
    JSON.stringify(components.api ?? []),
    ...Object.values(context.jsMap.client ?? {}),
    ...Object.values(context.jsMap.server ?? {}),
  ];
}

// Returns the sorted icon names (semantic, set and qualified, as the app
// writes them) that plugins/icons.js carries. Each resolves; the client looks
// every name up in that map, so "edit", "Pencil" and "lucide:Pencil" are all
// keys.
function buildIconImports({ blocks, components, context }) {
  const { icons } = context;
  validateIconNames({
    config: [components.global ?? {}, components.menus ?? [], components.pages ?? []],
    icons,
    context,
  });

  const names = new Set(alwaysBundledIcons);
  function addIfResolves(name) {
    if (resolveIconName({ name, ...icons }) !== null) {
      names.add(name);
    }
  }

  getConfigTexts({ components, context }).forEach((text) => {
    collectIconNames({ text }).forEach(addIfResolves);
  });

  blocks.forEach((block) => {
    (context.typesMap.icons[block.typeName] ?? []).forEach((name) => {
      if (resolveIconName({ name, ...icons }) === null) {
        context.handleWarning(
          new ConfigWarning(
            `Block type "${block.typeName}" (${block.package}) lists icon "${name}" in its meta.icons, which is not an icon name. The block may render the fallback icon.`,
            { checkSlug: 'icons' }
          )
        );
        return;
      }
      names.add(name);
    });
  });

  // buildIconContext validated every entry.
  (components.theme?.icons?.include ?? []).forEach((name) => names.add(name));

  return [...names].sort();
}

export default buildIconImports;
