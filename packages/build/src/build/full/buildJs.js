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

import generateClientJsModule from '../buildJs/generateClientJsModule.js';
import jsMapParser from '../buildJs/jsMapParser.js';

// A shell cannot load the web client's clientJsMap module, so a page a shell
// opens carries its own client _js as _jsEntries module text, as the dev
// server's page build does. A mobile page's _js stays out of the web module; a
// shared page's goes to both.
function buildPageClientJs({ page, context }) {
  if (page.target !== 'mobile' && page.target !== 'both') {
    return jsMapParser({ input: page, jsMap: context.jsMap, env: 'client' });
  }
  const pageJsMap = {};
  const cleanPage = jsMapParser({ input: page, jsMap: pageJsMap, env: 'client' });
  if (page.target === 'both') {
    jsMapParser({ input: page, jsMap: context.jsMap, env: 'client' });
  }
  if (Object.keys(pageJsMap.client).length > 0) {
    cleanPage._jsEntries = generateClientJsModule(pageJsMap.client);
  }
  return cleanPage;
}

function buildJs({ components, context }) {
  components.pages = components.pages.map((page) => {
    const pageRequests = [...(page.requests ?? [])];
    delete page.requests;
    const cleanPage = buildPageClientJs({ page, context });
    const cleanRequests = jsMapParser({ input: pageRequests, jsMap: context.jsMap, env: 'server' });
    return { ...cleanPage, requests: cleanRequests };
  });
  components.events = jsMapParser({
    input: components.events,
    jsMap: context.jsMap,
    env: 'client',
  });
  components.api = jsMapParser({
    input: components.api,
    jsMap: context.jsMap,
    env: 'server',
  });
  components.connections = jsMapParser({
    input: components.connections,
    jsMap: context.jsMap,
    env: 'server',
  });
}

export default buildJs;
