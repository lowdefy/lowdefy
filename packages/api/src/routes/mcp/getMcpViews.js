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

import getCanonicalUrl from '../../context/getCanonicalUrl.js';
import getViewHosts from './getViewHosts.js';
import resolveViewSources from './resolveViewSources.js';

// Each reason is logged once per process, not on every MCP request.
const loggedReasons = new Set();

function logOnce({ level, logger, message, reason }) {
  if (loggedReasons.has(reason)) {
    return;
  }
  loggedReasons.add(reason);
  logger[level]({ event: 'mcp_views_off', reason }, message);
}

// What this server needs to serve MCP App views, or null when it serves none.
// Everything view-shaped on the MCP server - the resources capability, the view
// metadata on tools, the view address in a result, the session tool - is on
// only when this returns settings, so a server that cannot show a view
// advertises none.
//
// Null when no tool has a view, and in two cases where one does:
// - the dev server, which serves the same MCP route but no built client for a
//   view to load;
// - an app whose canonical origin is not pinned, so the origin its views would
//   run on cannot be computed.
function getMcpViews({ config, logger, mcpConfig, mode, secrets }) {
  if (mcpConfig.views.configured !== true) {
    return null;
  }
  if (mode === 'dev') {
    logOnce({
      level: 'info',
      logger,
      message:
        'MCP views are off in the dev server: a view loads the built client, which only a production build has. Tools are served without their views.',
      reason: 'dev_server',
    });
    return null;
  }
  // One host, so one entry. Choosing an entry per caller belongs to the change
  // that adds a second host.
  const [host] = getViewHosts({ config });
  if (host === undefined) {
    logOnce({
      level: 'warn',
      logger,
      message:
        'MCP views are off: the app has no canonical URL, so the origin its views run on cannot be computed. Set BETTER_AUTH_URL or the url of the current environment.',
      reason: 'no_canonical_url',
    });
    return null;
  }
  return {
    appOrigin: new URL(getCanonicalUrl({ config })).origin,
    basePath: config.basePath ?? '',
    host,
    sources: resolveViewSources({ secrets, sources: mcpConfig.views.sources }),
  };
}

export default getMcpViews;
