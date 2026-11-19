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

// The _meta of the view resource's content item. The host renders a view on
// the domain it is told and refuses when that differs from the one it computes
// itself, and it blocks every origin the csp lists do not name: the app's own
// origin for the client bundle and API calls, its wss form for the websocket,
// and the other origins the app declared in mcp.viewSources.
function getViewResourceMeta({ views }) {
  const { appOrigin, host, sources } = views;
  const websocketOrigin = appOrigin.replace(/^http/, 'ws');
  return {
    ui: {
      domain: host.domain,
      csp: {
        resourceDomains: [appOrigin, ...sources],
        connectDomains: [appOrigin, websocketOrigin, ...sources],
      },
    },
  };
}

export default getViewResourceMeta;
