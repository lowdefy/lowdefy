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

import { buildBlockSchema } from '@lowdefy/block-utils';

import importPluginModule from './importPluginModule.js';

// Keyed by the meta object, which Node's module cache keeps for the life of
// the process: a block schema builds once, so its validator compiles once
// (@lowdefy/ajv keeps validators by schema object), across the rebuilds of
// one dev server too.
const blockSchemasByMeta = new WeakMap();

function getBlockSchema(meta) {
  if (!blockSchemasByMeta.has(meta)) {
    blockSchemasByMeta.set(meta, buildBlockSchema(meta));
  }
  return blockSchemasByMeta.get(meta);
}

// A package's module is imported once per build, whichever type asks for it.
function importCached({ context, specifier }) {
  context.pluginModuleCache ??= new Map();
  if (!context.pluginModuleCache.has(specifier)) {
    context.pluginModuleCache.set(specifier, importPluginModule({ context, specifier }));
  }
  return context.pluginModuleCache.get(specifier);
}

// The types map's schema entry for a type: { package, schema }, and a block's
// meta hazards. The default packages' entries ship with the build
// (createDefaultTypesMap). An entry applies only to the package it came from,
// so a plugin that registers a default type name keeps its own schema.
function findTypesMapSchema({ context, kind, type }) {
  const entry = context.typesMap.schemas?.[kind]?.[type.typeName];
  if (entry?.package !== type.package) {
    return undefined;
  }
  return entry;
}

// The schema of one block, action or operator type, as the plugins/*Schemas.json
// artifacts carry it: the types map's schema when it has one, else the
// package's. A block's schema is built from its meta (`./metas`, else
// `./schemas`), returned beside it; a block whose package does not import gets
// the meta fields the types map carries. An action's or operator's schema is
// its `./schemas` entry. type is a types map entry: { typeName,
// originalTypeName, package }.
async function loadPluginTypeSchema({ context, kind, type }) {
  const entry = findTypesMapSchema({ context, kind, type });
  if (kind === 'blocks') {
    let metas = await importCached({ context, specifier: `${type.package}/metas` });
    if (!metas) {
      metas = await importCached({ context, specifier: `${type.package}/schemas` });
    }
    let meta = metas?.[type.originalTypeName];
    if (!meta && entry) {
      meta = { hazards: entry.hazards };
    }
    return { schema: entry?.schema ?? (meta ? getBlockSchema(meta) : undefined), meta };
  }
  if (entry) {
    return { schema: entry.schema };
  }
  const schemas = await importCached({ context, specifier: `${type.package}/schemas` });
  return { schema: schemas?.[type.originalTypeName] };
}

export default loadPluginTypeSchema;
