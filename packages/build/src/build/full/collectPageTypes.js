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

import { type } from '@lowdefy/helpers';

import basicTypes from '@lowdefy/blocks-basic/types';
import loaderTypes from '@lowdefy/blocks-loaders/types';

import buildIconImports from '../buildImports/buildIconImports.js';
import defaultIconsProd from '../buildImports/defaultIconsProd.js';

// D14: the type names ONE page needs at render time — block components,
// client action types, client operators, and icons. Names validate against
// the app's used-type maps (components.types), so unknown strings that
// merely look like types are ignored.
function collectPageTypes({ page, components, context }) {
  const blockTypes = new Set();
  const actionTypes = new Set();
  const operatorTypes = new Set();
  const knownBlocks = components.types?.blocks ?? {};
  const knownActions = components.types?.actions ?? {};
  const knownOperators = components.types?.operators?.client ?? {};

  // The mandatory runtime set (buildTypes counts these into every app): the
  // client shell renders Message and the progress bar, loaders render
  // skeletons before page types settle, validation evaluates _not/_type,
  // and the antd menus dispatch SetDarkMode. Every page carries them — the
  // bundler dedupes the lot into one shared base chunk.
  basicTypes.blocks.forEach((name) => knownBlocks[name] && blockTypes.add(name));
  loaderTypes.blocks.forEach((name) => knownBlocks[name] && blockTypes.add(name));
  if (knownBlocks.Message) blockTypes.add('Message');
  if (knownActions.SetDarkMode) actionTypes.add('SetDarkMode');
  ['_not', '_type'].forEach((name) => knownOperators[name] && operatorTypes.add(name));

  function walk(node) {
    if (type.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (!type.isObject(node)) {
      return;
    }
    if (type.isString(node.type)) {
      if (knownBlocks[node.type]) {
        blockTypes.add(node.type);
      }
      if (knownActions[node.type]) {
        actionTypes.add(node.type);
      }
    }
    const keys = Object.keys(node);
    const nonTilde = keys.filter((k) => !k.startsWith('~'));
    if (nonTilde.length === 1 && nonTilde[0].startsWith('_')) {
      const base = `_${nonTilde[0].slice(1)}`.split('.')[0];
      if (knownOperators[base]) {
        operatorTypes.add(base);
      }
    }
    keys.forEach((key) => walk(node[key]));
  }
  walk(page);

  const blockImports = [...blockTypes].sort().map((typeName) => ({
    typeName,
    originalTypeName: knownBlocks[typeName].originalTypeName,
    package: knownBlocks[typeName].package,
  }));

  // Page-scoped icon scan plus app-shell config (global, menus render inside
  // page layouts) and the block types' default icons — seeded with the
  // defaults the client snapshots at init (loading and error icons).
  const iconImports = buildIconImports({
    blocks: blockImports,
    components: { global: components.global, menus: components.menus, pages: [page] },
    context,
    defaults: defaultIconsProd,
  });

  return {
    actions: [...actionTypes].sort().map((typeName) => ({
      typeName,
      originalTypeName: knownActions[typeName].originalTypeName,
      package: knownActions[typeName].package,
    })),
    blocks: blockImports,
    icons: iconImports,
    operators: [...operatorTypes].sort().map((typeName) => ({
      typeName,
      originalTypeName: knownOperators[typeName].originalTypeName,
      package: knownOperators[typeName].package,
    })),
  };
}

export default collectPageTypes;
