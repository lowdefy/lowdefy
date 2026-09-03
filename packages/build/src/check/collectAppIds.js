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

import path from 'path';

import { type } from '@lowdefy/helpers';

import buildAppMeta from '../build/buildAppMeta.js';
import buildModuleDefs from '../build/buildModuleDefs.js';
import buildRefs from '../build/buildRefs/buildRefs.js';
import collectMigrationFiles from '../build/buildMigrations/collectMigrationFiles.js';
import createContext from '../createContext.js';

const ROOT_FILE = 'lowdefy.yaml';

export const ID_KINDS = [
  'page',
  'request',
  'endpoint',
  'connection',
  'component',
  'collection',
  'migration',
];

// The walker tags every resolved node with the id of the ref it came from, and
// the ref map records that ref's file. A node with no ref of its own was
// written inline in the root file.
function sourceOf({ context, node }) {
  const refPath = context.refMap[node?.['~r']]?.path ?? ROOT_FILE;
  return path.resolve(context.directories.config, refPath);
}

// Ids that are not strings are the build's own validations to report; this
// collector only answers "which ids does this config declare".
function addId({ ids, kind, id, source }) {
  if (!type.isString(id) || id === '') return;
  if (type.isUndefined(ids[kind][id])) {
    ids[kind][id] = source;
  }
}

function collectListIds({ context, ids, kind, list }) {
  if (!type.isArray(list)) return;
  list.forEach((item) => {
    if (!type.isObject(item)) return;
    addId({ ids, kind, id: item.id, source: sourceOf({ context, node: item }) });
  });
}

// Requests are declared on any block in a page, not only on the page itself,
// so the whole page tree is walked for `requests` arrays. Request ids are
// unique per page, so the page id is part of the key.
function collectRequestIds({ context, ids, node, pageId }) {
  if (type.isArray(node)) {
    node.forEach((child) => collectRequestIds({ context, ids, node: child, pageId }));
    return;
  }
  if (!type.isObject(node)) return;
  if (type.isArray(node.requests)) {
    node.requests.forEach((request) => {
      if (!type.isObject(request) || !type.isString(request.id)) return;
      addId({
        ids,
        kind: 'request',
        id: `${pageId}.${request.id}`,
        source: sourceOf({ context, node: request }),
      });
    });
  }
  Object.keys(node).forEach((key) => {
    if (key.startsWith('~') || key === 'requests') return;
    collectRequestIds({ context, ids, node: node[key], pageId });
  });
}

function collectPageIds({ context, ids, pages }) {
  if (!type.isArray(pages)) return;
  pages.forEach((page) => {
    if (!type.isObject(page)) return;
    addId({ ids, kind: 'page', id: page.id, source: sourceOf({ context, node: page }) });
    if (type.isString(page.id)) {
      collectRequestIds({ context, ids, node: page, pageId: page.id });
    }
  });
}

// Components are authored as a map keyed by id, with a deprecated array form.
function collectComponentIds({ context, ids, componentsConfig }) {
  if (type.isArray(componentsConfig)) {
    collectListIds({ context, ids, kind: 'component', list: componentsConfig });
    return;
  }
  if (!type.isObject(componentsConfig)) return;
  Object.keys(componentsConfig)
    .filter((id) => !id.startsWith('~'))
    .forEach((id) =>
      addId({
        ids,
        kind: 'component',
        id,
        source: sourceOf({ context, node: componentsConfig[id] }),
      })
    );
}

function collectCollectionIds({ context, ids, collections }) {
  if (!type.isObject(collections)) return;
  Object.keys(collections)
    .filter((name) => !name.startsWith('~'))
    .forEach((name) =>
      addId({ ids, kind: 'collection', id: name, source: sourceOf({ context, node: collections }) })
    );
}

// The declared ids of one app config, by kind, each mapped to the file that
// declares it. Only the ref-resolution phases of the build run: ids exist once
// refs, modules and build operators have resolved, so nothing later is needed
// to answer what this config declares.
async function collectAppIds({
  customMessagesMap,
  customTypesMap,
  directories,
  logger,
  refResolver,
}) {
  const context = createContext({
    customMessagesMap,
    customTypesMap,
    directories,
    logger,
    refResolver,
    stage: 'prod',
    validateOnly: true,
  });

  await buildAppMeta({ context });
  await buildModuleDefs({ context });
  const components = (await buildRefs({ context })) ?? {};

  const ids = Object.fromEntries(ID_KINDS.map((kind) => [kind, {}]));

  collectPageIds({ context, ids, pages: components.pages });
  collectListIds({ context, ids, kind: 'endpoint', list: components.api });
  collectListIds({ context, ids, kind: 'connection', list: components.connections });
  collectComponentIds({ context, ids, componentsConfig: components.components });
  collectCollectionIds({ context, ids, collections: components.collections });

  const migrations = await collectMigrationFiles({ directories });
  migrations.forEach((migration) =>
    addId({ ids, kind: 'migration', id: migration.id, source: migration.filePath })
  );

  return ids;
}

export default collectAppIds;
