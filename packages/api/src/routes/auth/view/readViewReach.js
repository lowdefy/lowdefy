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

// What a view session may reach besides its pages' own requests: the
// endpoints, websocket channels and agents the build listed for the app's view
// pages (mcp.json views.pages). The lists are per page and the session is not
// tied to one page, so an id listed for any view page is reachable. An
// endpoint listed for several pages carries one scope, since the build derives
// it from the endpoint alone.
//
// The dev build writes views.pages empty, and the build lists no agent for any
// page, so both read here as nothing reachable.
async function readViewReach({ readConfigFile }) {
  const mcpConfig = await readConfigFile('mcp.json');
  const endpoints = new Map();
  const websockets = new Set();
  const agents = new Set();
  Object.values(mcpConfig?.views?.pages ?? {}).forEach((page) => {
    (page.endpoints ?? []).forEach(({ id, scope }) => endpoints.set(id, scope));
    (page.websockets ?? []).forEach((id) => websockets.add(id));
    (page.agents ?? []).forEach((id) => agents.add(id));
  });
  return { agents, endpoints, websockets };
}

export default readViewReach;
