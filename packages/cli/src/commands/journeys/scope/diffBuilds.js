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

import normaliseArtifact from './normaliseArtifact.js';

function sameArtifact(base, head) {
  return JSON.stringify(normaliseArtifact(base)) === JSON.stringify(normaliseArtifact(head));
}

function sameFile({ file, base, head }) {
  if (file.endsWith('.json')) {
    return sameArtifact(base, head);
  }
  return base === head;
}

// The keys of two groups whose artifacts differ, are new or are gone.
function changedKeys({ base, head, same = sameArtifact }) {
  const keys = new Set([...Object.keys(base), ...Object.keys(head)]);
  return [...keys]
    .filter((key) => !(key in base) || !(key in head) || !same(base[key], head[key], key))
    .sort();
}

function changedRequests({ base, head }) {
  const pageIds = new Set([...Object.keys(base), ...Object.keys(head)]);
  return [...pageIds].sort().flatMap((pageId) =>
    changedKeys({ base: base[pageId] ?? {}, head: head[pageId] ?? {} }).map((requestId) => ({
      pageId,
      requestId,
    }))
  );
}

// What changed between two builds (readBuildArtifacts results), compared
// after normalising: pages changed or new in the head, requests, endpoints,
// connections and websockets changed, added or removed, the app-wide
// artifacts that changed, the uncompared files that changed (listed so an
// empty scope never reads as "nothing changed"), and the pages removed.
function diffBuilds({ baseBuild, headBuild }) {
  const removedPages = Object.keys(baseBuild.pages)
    .filter((pageId) => !(pageId in headBuild.pages))
    .sort();
  return {
    pages: changedKeys({ base: baseBuild.pages, head: headBuild.pages }).filter(
      (pageId) => pageId in headBuild.pages
    ),
    requests: changedRequests({ base: baseBuild.requests, head: headBuild.requests }),
    endpoints: changedKeys({ base: baseBuild.endpoints, head: headBuild.endpoints }),
    connections: changedKeys({ base: baseBuild.connections, head: headBuild.connections }),
    websockets: changedKeys({ base: baseBuild.websockets, head: headBuild.websockets }),
    appWide: changedKeys({ base: baseBuild.appWide, head: headBuild.appWide }),
    uncompared: changedKeys({
      base: baseBuild.files,
      head: headBuild.files,
      same: (base, head, file) => sameFile({ file, base, head }),
    }),
    removedPages,
  };
}

export default diffBuilds;
