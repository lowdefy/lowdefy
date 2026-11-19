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

import { getMcpResourceUri } from './getMcpUri.js';
import getMcpViews from './getMcpViews.js';

// The start-up line of an app with a view. A host renders a view only when the
// connector was added with exactly the URL the view origin is computed from, so
// both are logged where whoever deploys the app will look. Resolving the views
// here also fails the start, not the first view, on a viewSources secret that
// is not set.
function logMcpViews({ config, logger, mcpConfig, secrets }) {
  const views = getMcpViews({ config, logger, mcpConfig, mode: 'prod', secrets });
  if (views === null) {
    return;
  }
  const connectorUrl = getMcpResourceUri({ config });
  logger.info(
    { event: 'mcp_views', connectorUrl, viewOrigin: views.host.origin },
    `MCP views are on. Add the connector with exactly the URL ${connectorUrl}. Its views run on ${views.host.origin}.`
  );
}

export default logMcpViews;
