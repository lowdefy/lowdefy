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

import collectPageDependencies from './collectPageDependencies.js';
import diffPageBlocks from './diffPageBlocks.js';
import normaliseArtifact from './normaliseArtifact.js';
import resolveHomePageId from './resolveHomePageId.js';

const ENTRY_PAGE_COUNT = 3;
// The default page the build adds; it tells nothing about a change.
const NOT_FOUND_PAGE_ID = '404';

function changeReasons({ diff, headBuild, pageId }) {
  const reasons = [];
  if (diff.pages.includes(pageId)) reasons.push('page');
  diff.requests
    .filter((request) => request.pageId === pageId)
    .forEach((request) => reasons.push(`request:${request.requestId}`));
  const dependencies = collectPageDependencies({ build: headBuild, pageId });
  dependencies.endpoints
    .filter((endpointId) => diff.endpoints.includes(endpointId))
    .forEach((endpointId) => reasons.push(`endpoint:${endpointId}`));
  dependencies.connections
    .filter((connectionId) => diff.connections.includes(connectionId))
    .forEach((connectionId) => reasons.push(`connection:${connectionId}`));
  dependencies.websockets
    .filter((websocketId) => diff.websockets.includes(websocketId))
    .forEach((websocketId) => reasons.push(`websocket:${websocketId}`));
  return reasons;
}

// App-wide artifacts can affect any page; they add the pages most sessions
// start on (coverage.json's production entry points) or the home page.
function entryPages({ coverage, headBuild }) {
  const entryPoints = coverage?.production?.entryPoints ?? [];
  const pages = entryPoints
    .map((entry) => entry.page)
    .filter((pageId) => pageId in headBuild.pages)
    .slice(0, ENTRY_PAGE_COUNT);
  if (pages.length > 0) return pages;
  const home = resolveHomePageId({ build: headBuild });
  return type.isNone(home) ? [] : [home];
}

function authChanged({ baseBuild, headBuild, pageId }) {
  const basePage = baseBuild?.pages[pageId];
  if (type.isNone(basePage)) return false;
  const baseAuth = normaliseArtifact(basePage).auth;
  const headAuth = normaliseArtifact(headBuild.pages[pageId]).auth;
  return JSON.stringify(baseAuth) !== JSON.stringify(headAuth);
}

// The head pages a change touched, each with why: its own artifact (page),
// one of its requests (request:<id>), an endpoint it calls (endpoint:<id>),
// a connection its requests or endpoints use (connection:<id>), a websocket
// it subscribes to (websocket:<id>), or an app-wide artifact (app-wide: the
// entry pages). A change that travels through _ref shows on every page whose
// artifact holds it. With no base build every head page is listed
// (base-not-built) and the base error is a warning. Removed pages are
// reported, not listed.
function selectTargets({ diff, baseBuild, headBuild, coverage = null, baseError }) {
  const reasonsByPage = new Map();
  function addReasons(pageId, reasons) {
    if (reasons.length === 0) return;
    reasonsByPage.set(pageId, [...(reasonsByPage.get(pageId) ?? []), ...reasons]);
  }
  const warnings = [];
  const headPageIds = Object.keys(headBuild.pages).sort();

  if (type.isNone(baseBuild)) {
    warnings.push(baseError);
    headPageIds
      .filter((pageId) => pageId !== NOT_FOUND_PAGE_ID)
      .forEach((pageId) => addReasons(pageId, ['base-not-built']));
  } else {
    headPageIds.forEach((pageId) => addReasons(pageId, changeReasons({ diff, headBuild, pageId })));
    if (diff.appWide.length > 0) {
      entryPages({ coverage, headBuild }).forEach((pageId) => addReasons(pageId, ['app-wide']));
    }
  }

  const pages = [...reasonsByPage.keys()].sort().map((pageId) => ({
    pageId,
    reasons: [...new Set(reasonsByPage.get(pageId))],
    authChanged: authChanged({ baseBuild, headBuild, pageId }),
    blocks: diffPageBlocks({
      basePage: baseBuild?.pages[pageId],
      headPage: headBuild.pages[pageId],
      keyMap: headBuild.keyMap,
      refMap: headBuild.refMap,
    }),
  }));
  return {
    pages,
    appWide: type.isNone(baseBuild) ? [] : diff.appWide,
    uncompared: type.isNone(baseBuild) ? [] : diff.uncompared,
    removedPages: type.isNone(baseBuild) ? [] : diff.removedPages,
    warnings,
  };
}

export default selectTargets;
