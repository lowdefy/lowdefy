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

import jsMapParser from '../buildJs/jsMapParser.js';

function buildJsShallow({ components, context }) {
  // Extract JS from non-shallow pages (client + server)
  components.pages = (components.pages ?? []).map((page) => {
    if (page['~shallow']) return page;
    const pageRequests = [...(page.requests ?? [])];
    delete page.requests;
    const cleanPage = jsMapParser({ input: page, jsMap: context.jsMap, env: 'client' });
    const cleanRequests = jsMapParser({
      input: pageRequests,
      jsMap: context.jsMap,
      env: 'server',
    });
    return { ...cleanPage, requests: cleanRequests };
  });

  // Extract JS from api/connections (shallow page JS built JIT, non-shallow already extracted)
  if (components.api) {
    components.api = jsMapParser({
      input: components.api,
      jsMap: context.jsMap,
      env: 'server',
    });
  }
  if (components.connections) {
    components.connections = jsMapParser({
      input: components.connections,
      jsMap: context.jsMap,
      env: 'server',
    });
  }

  // Ensure both client and server jsMap keys exist.
  // Shallow pages defer both client and server JS extraction to JIT build.
  // Non-shallow pages have already been fully extracted above.
  if (!context.jsMap.client) {
    context.jsMap.client = {};
  }
  if (!context.jsMap.server) {
    context.jsMap.server = {};
  }
}

export default buildJsShallow;
