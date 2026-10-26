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

let loading = null;

// The docs routes and the docs index they search, loaded on first use: their
// module graph (the MCP server, the journey runner, the doc readers) is most of
// what a child would otherwise evaluate before it answers its first request.
// Every caller shares one load, so the modules are evaluated once. A failed
// load is not kept, so the next docs request tries again.
function loadDocsRoutes() {
  if (loading === null) {
    loading = Promise.all([
      import('./buildStatus.js'),
      import('./events.js'),
      import('./find.js'),
      import('./index.js'),
      import('./journey.js'),
      import('./mcp.js'),
      import('./mutants.js'),
      import('./pageConfig.js'),
      import('./restart.js'),
      import('../../../lib/docs/getDocsIndex.js'),
    ]).then(
      ([
        buildStatus,
        events,
        find,
        index,
        journey,
        mcp,
        mutants,
        pageConfig,
        restart,
        docsIndex,
      ]) => ({
        buildStatus: buildStatus.default,
        events: events.default,
        find: find.default,
        index: index.default,
        journey: journey.default,
        mcp: mcp.default,
        mutants: mutants.default,
        pageConfig: pageConfig.default,
        restart: restart.default,
        getDocsIndex: docsIndex.default,
      }),
      (error) => {
        loading = null;
        throw error;
      }
    );
  }
  return loading;
}

export default loadDocsRoutes;
