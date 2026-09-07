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

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';

import callRequest from './callRequest.js';
import getPageConfig from '../page/getPageConfig.js';

// config.requestTimeout default, mirrored from app.js. The value may be 0, which
// means no HTTP deadline at all; consumers must treat 0 as "none", not as a
// deadline.
const DEFAULT_REQUEST_TIMEOUT = 30000;

// Backstop against runaway recursion. app.callRequest carries a render-depth
// counter on the context it constructs (the endpointDepth precedent): the report
// page's own data requests run at depth 1, and a second level throws. The precise
// "a report may not render a report" rule is enforced one layer up — the
// RenderReport resolver refuses to run at renderDepth > 0 (app.renderDepth), so a
// nested report throws before it ever reaches this cap; this only bounds the
// generic request graph in case a future appAccess resolver recurses.
const MAX_RENDER_DEPTH = 1;

async function readJsonArtifact(readConfigFile, filePath) {
  const artifact = await readConfigFile(filePath);
  return type.isNone(artifact) ? {} : artifact;
}

// The opt-in `app` capability handed to a request resolver whose meta declares
// `appAccess: true`. It is the only seam through which a resolver reads built
// page config and re-enters the app's own requests. Authorization is applied
// inside core (getPageConfig, callRequest → authorizeRequest), never handed
// out. The build artifacts a resolver may read are named one by one: the raw
// config reader would expose every page and connection file, bypassing
// authorize, so it is not on this object.
function createApp(context) {
  const reportsRuntime = context.reportsRuntime ?? {};
  return {
    // Applies context.authorize; returns null for an unknown page AND an
    // unauthorized one, so the resolver can never become an existence oracle.
    getPageConfig: (args) => getPageConfig(context, args),
    readBlockMetas: () => readJsonArtifact(context.readConfigFile, 'plugins/blockMetas.json'),
    readGlobal: () => readJsonArtifact(context.readConfigFile, 'global.json'),
    // Compiled only when the reports plugin is declared; undefined otherwise.
    readReportStylesheet: async () => {
      const stylesheet = await context.readConfigFile('reports/styles.css');
      return type.isNone(stylesheet) ? undefined : stylesheet;
    },
    // Re-enters authorizeRequest with the invoking session, so a report can
    // never read data its user could not load in the browser.
    callRequest: (args) => {
      const renderDepth = (context.renderDepth ?? 0) + 1;
      if (renderDepth > MAX_RENDER_DEPTH) {
        throw new ConfigError(
          `Report render depth exceeded maximum of ${MAX_RENDER_DEPTH}. ` +
            'A report request may not render another report.'
        );
      }
      // A fresh child context per call: callRequest mutates blockId/pageId/
      // payload/evaluateOperators on the context it is handed, so the page
      // requests a single render fires concurrently must not share one context.
      return callRequest({ ...context, renderDepth }, args);
    },
    // The build's reportsRuntime.js artifact: renderer registry, client
    // operators, compiled _js map, and icon components. Empty maps for an app
    // that never declared the reports plugin.
    blocksStatic: reportsRuntime.blocksStatic ?? {},
    clientOperators: reportsRuntime.clientOperators ?? {},
    clientJsMap: reportsRuntime.clientJsMap ?? {},
    icons: reportsRuntime.icons ?? {},
    // The request's own origin, derived from the Host header. Fit for building
    // the synthetic page location; not a trust boundary.
    origin: context.origin,
    // The server's copy of the app's public/ folder, for resolving relative
    // asset paths from disk.
    publicDirectory: context.publicDirectory,
    // The render depth this resolver runs at: 0 for the top-level report request,
    // ≥ 1 when reached from another report's own requests. RenderReport reads it
    // to refuse rendering a report from within a report.
    renderDepth: context.renderDepth ?? 0,
    requestTimeout: context.config?.requestTimeout ?? DEFAULT_REQUEST_TIMEOUT,
    // True for scheduled, webhook, and detached runs, which have no user session
    // and were authorized at the transport layer. An anonymous visitor on a
    // public page is NOT a system context — it has no user either, which is why
    // the flag is explicit rather than inferred from `user`.
    system: context.system === true,
    user: context.user,
    logger: context.logger,
  };
}

export default createApp;
