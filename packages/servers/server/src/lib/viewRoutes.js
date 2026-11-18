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

// The app server routes an MCP App view may call. A view runs the app's client
// on its host's origin (getViewHosts in @lowdefy/api), so it calls the app
// across origins, with a bearer view session and never a cookie.
//
// cors: the routes that answer a view's origin with CORS headers (viewCors).
// No other route does, /api/auth and /api/mcp included.
//
// session: the routes a view session is admitted on (admitViewSession). A view
// session is refused on every other /api route by refuseViewSession, so a
// route added to app.js is closed to views until it is listed here. A route
// listed here still applies its own limits: what a view session may read on
// the page, request, endpoint, agent and websocket routes is checked in
// @lowdefy/api.
const cors = [
  '/api/view/boot',
  '/api/view/root',
  '/api/page/*',
  '/api/request/*',
  '/api/endpoints/*',
  '/api/agent/*',
  '/api/user',
  '/api/client-error',
  '/api/usage',
];

// A websocket handshake is not subject to CORS: its Origin is checked by
// isWebSocketOriginAllowed.
const session = [...cors, '/api/websocket'];

export default { cors, session };
