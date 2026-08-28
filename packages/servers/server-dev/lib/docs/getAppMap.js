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

import fs from 'node:fs';
import path from 'node:path';
import { type } from '@lowdefy/helpers';

import readBuildArtifact from './readBuildArtifact.js';

// Recursively counts blocks on a page, including blocks nested in slots
// (packages/build/src/build/buildPages/buildBlock/moveAreasToSlots.js moves
// "areas" to "slots" during build, so built page artifacts only ever have
// "slots").
function countBlocks(blocks, types) {
  let count = 0;
  (blocks ?? []).forEach((block) => {
    count += 1;
    if (block.type) {
      types.add(block.type);
    }
    Object.values(block.slots ?? {}).forEach((slot) => {
      count += countBlocks(slot?.blocks, types);
    });
  });
  return count;
}

function summarizeBlocks(blocks) {
  const types = new Set();
  const blockCount = countBlocks(blocks, types);
  return { blockCount, blockTypes: [...types] };
}

// The request's "type" is stripped from the page artifact by the build
// (packages/build/src/build/full/writeRequests.js deletes
// type/connectionId/properties/auth after writing the per-request file), so
// it is read from the dedicated per-request artifact instead.
function summarizeRequests({ pageId, requests }) {
  return (requests ?? []).map((request) => {
    const requestConfig = readBuildArtifact({
      name: `pages/${pageId}/requests/${request.requestId}.json`,
      deserialize: true,
    });
    return { id: request.requestId, type: requestConfig?.type ?? null };
  });
}

function getPages() {
  const registry = readBuildArtifact({ name: 'pageRegistry.json' }) ?? {};
  const pages = [];
  let unbuiltCount = 0;

  Object.entries(registry).forEach(([pageId, entry]) => {
    const built = readBuildArtifact({ name: `pages/${pageId}.json`, deserialize: true });
    const page = {
      pageId,
      file: entry.refPath,
      auth: entry.auth,
      built: !type.isNone(built),
    };
    if (type.isNone(built)) {
      unbuiltCount += 1;
    } else {
      Object.assign(page, summarizeBlocks(built.blocks));
      page.requests = summarizeRequests({ pageId, requests: built.requests });
    }
    pages.push(page);
  });

  return { pages, unbuiltCount };
}

// Menu items can nest further links (e.g. MenuGroup), so this recurses; kept
// to id/type/pageId/title only — no properties/auth noise.
function summarizeMenuItem(menuItem) {
  const summary = {
    menuItemId: menuItem.menuItemId ?? menuItem.id,
    type: menuItem.type,
  };
  if (!type.isNone(menuItem.pageId)) {
    summary.pageId = menuItem.pageId;
  }
  if (!type.isNone(menuItem.properties?.title)) {
    summary.title = menuItem.properties.title;
  }
  if (type.isArray(menuItem.links)) {
    summary.links = menuItem.links.map(summarizeMenuItem);
  }
  return summary;
}

function getMenus() {
  const menus = readBuildArtifact({ name: 'menus.json', deserialize: true }) ?? [];
  return menus.map((menu) => ({
    menuId: menu.menuId ?? menu.id,
    links: (menu.links ?? []).map(summarizeMenuItem),
  }));
}

function getConnections() {
  const ids = readBuildArtifact({ name: 'connectionIds.json' }) ?? [];
  return ids.map((id) => {
    const connection = readBuildArtifact({ name: `connections/${id}.json`, deserialize: true });
    return { id, type: connection?.type ?? null };
  });
}

// api/ and agents/ have one artifact file per id and no id manifest (unlike
// connectionIds.json / websocketIds.json), so their ids come from a
// directory listing instead of readBuildArtifact.
function listArtifactIds({ buildDirectory, dirName }) {
  const dirPath = path.join(buildDirectory, dirName);
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  return fs
    .readdirSync(dirPath)
    .filter((filename) => filename.endsWith('.json'))
    .map((filename) => filename.slice(0, -'.json'.length));
}

function getEndpoints({ buildDirectory }) {
  return listArtifactIds({ buildDirectory, dirName: 'api' }).map((id) => {
    const endpoint = readBuildArtifact({ name: `api/${id}.json`, deserialize: true });
    return { id, type: endpoint?.type ?? null };
  });
}

function getAgents({ buildDirectory }) {
  return listArtifactIds({ buildDirectory, dirName: 'agents' }).map((id) => {
    const agent = readBuildArtifact({ name: `agents/${id}.json`, deserialize: true });
    return { id, type: agent?.type ?? null };
  });
}

function getWebsockets() {
  return readBuildArtifact({ name: 'websocketIds.json' }) ?? [];
}

// Compact snapshot of the whole app for an agent to orient itself: every
// page (with block/request detail only for pages that have a built
// artifact — pages are JIT-built on first visit, see lib/docs/getPageConfig.js),
// menus, connections, api endpoints, agents and websockets.
function getAppMap() {
  const buildDirectory = path.join(process.cwd(), 'build');
  const { pages, unbuiltCount } = getPages();

  const map = {
    pages,
    menus: getMenus(),
    connections: getConnections(),
    endpoints: getEndpoints({ buildDirectory }),
    agents: getAgents({ buildDirectory }),
    websockets: getWebsockets(),
  };

  if (unbuiltCount > 0) {
    map.note =
      `${unbuiltCount} page(s) have not been built yet, so only "file" and "auth" are shown ` +
      'for them. Visit the page in the browser, or GET /lowdefy-docs/page/{pageId}, to trigger ' +
      'a build and see their blocks and requests.';
  }

  return map;
}

export default getAppMap;
