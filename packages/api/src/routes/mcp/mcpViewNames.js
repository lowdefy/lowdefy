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

// The names an MCP App view is wired together with. They are on the wire: a
// host caches a view's HTML across deploys and a connected client keeps its
// tool list, so a name changed here breaks views that are already open.

// The one resource every tool with a view points at. The page a call shows is
// in the call's result, not in the resource, so one resource serves them all.
const VIEW_RESOURCE_URI = 'ui://lowdefy/view';

const VIEW_RESOURCE_MIME_TYPE = 'text/html;profile=mcp-app';

// The built-in tool a view calls for its session.
const VIEW_SESSION_TOOL = 'lowdefy_view_session';

// The key in a view tool's result _meta that carries { path }, the address of
// the page to show: the page's path and query, starting with "/", with no
// origin and no basePath.
const VIEW_ADDRESS_META_KEY = 'lowdefy/view';

// The key in the session tool's result _meta that carries
// { token, expiresAt }: the bearer session token and its ISO 8601 expiry.
const VIEW_SESSION_META_KEY = 'lowdefy/viewSession';

export {
  VIEW_ADDRESS_META_KEY,
  VIEW_RESOURCE_MIME_TYPE,
  VIEW_RESOURCE_URI,
  VIEW_SESSION_META_KEY,
  VIEW_SESSION_TOOL,
};
