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

import callRequest from './callRequest.js';
import getPageConfig from '../page/getPageConfig.js';

// config.requestTimeout default, mirrored from app.js — the plugin's own
// generation timeout has to sit below it.
const DEFAULT_REQUEST_TIMEOUT = 30000;

// Backstop against runaway recursion. app.callRequest carries a render-depth
// counter on the context it constructs (the endpointDepth precedent): the report
// page's own data requests run at depth 1, and a second level throws. The precise
// "a report may not render a report" rule is enforced one layer up — the
// RenderReport resolver refuses to run at renderDepth > 0 (app.renderDepth), so a
// nested report throws before it ever reaches this cap; this only bounds the
// generic request graph in case a future appAccess resolver recurses.
const MAX_RENDER_DEPTH = 1;

// The opt-in `app` capability handed to a request resolver whose meta declares
// `appAccess: true`. It is the only seam through which a resolver reads built
// page config and re-enters the app's own requests. Authorization is applied
// inside core (getPageConfig, callRequest → authorizeRequest), never handed
// out: the resolver receives accessors, not the gates themselves.
function createApp(context) {
  return {
    // Applies context.authorize; returns null for an unknown page AND an
    // unauthorized one, so the resolver can never become an existence oracle.
    getPageConfig: (args) => getPageConfig(context, args),
    // The existing sanitised, cached reader — an accessor for build artifacts
    // (global.json, blockMetas.json, the report stylesheet), not a gate.
    readConfigFile: context.readConfigFile,
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
    // Build artifacts that are JavaScript arrive as values apiContext imports
    // statically — undefined until the reports build steps and the injection
    // land, which is when a resolver first consumes them.
    blocksStatic: context.blocksStatic,
    clientOperators: context.clientOperators,
    clientJsMap: context.clientJsMap,
    icons: context.icons,
    origin: context.origin,
    // The render depth this resolver runs at: 0 for the top-level report request,
    // ≥ 1 when reached from another report's own requests. RenderReport reads it
    // to refuse rendering a report from within a report.
    renderDepth: context.renderDepth ?? 0,
    requestTimeout: context.config?.requestTimeout ?? DEFAULT_REQUEST_TIMEOUT,
    user: context.user,
    logger: context.logger,
  };
}

export default createApp;
