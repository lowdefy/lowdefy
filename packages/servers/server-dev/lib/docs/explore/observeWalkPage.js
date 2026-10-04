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

import { collectKnownText } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

import observeWalk from './observeWalk.js';
import readWalkPageExclusions from './readWalkPageExclusions.js';

// What a walk that left the app sees: nothing to act on. The explorer stops
// such a walk (left-app).
function leftAppObservation({ url, open }) {
  const observation = {
    pageId: null,
    url,
    ready: false,
    leftApp: true,
    shape: null,
    candidates: [],
    excluded: {
      dateOrObjectInput: 0,
      externalLink: 0,
      externalConnection: [],
      authAction: 0,
      snapshotRow: 0,
    },
  };
  if (open) observation.redirected = true;
  return observation;
}

// Observes the walk's current page (see observeWalk). Known text grows with
// the walk: every page it has shown, and the values it typed, so a record it
// created reads as known text in a grid. A page that closed, or a document
// that is not an app page, is reported as leftApp.
async function observeWalkPage({ walk, open = false }) {
  const { page } = walk.runner.actors.current();
  if (page.isClosed()) {
    return leftAppObservation({ url: null, open });
  }
  const pageId = await page.evaluate(() => window.lowdefy?.pageId ?? null).catch(() => null);
  if (type.isNone(pageId)) {
    return leftAppObservation({ url: page.url(), open });
  }
  walk.visitedPages.add(pageId);
  const knownText = collectKnownText({
    buildDirectory: walk.buildDirectory,
    pageIds: [...walk.visitedPages],
    dataSet: walk.dataSet,
    typed: walk.typed,
  });
  const { externalBlocks, authActionBlocks } = readWalkPageExclusions({ walk, pageId });
  return observeWalk({
    page,
    walk: {
      pageId: walk.pageId,
      externalBlocks,
      authActionBlocks,
      allowExternal: walk.allowExternal,
      knownText,
      snapshot: walk.snapshot,
    },
    open,
  });
}

export default observeWalkPage;
