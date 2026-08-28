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

import { serializer, type } from '@lowdefy/helpers';

import collectReportOptions from '../../../collectReportOptions.js';
import generateReport from '../../../generateReport.js';
import getReportStylesheet from '../../../render/stylesheet.js';
import resolveRenderer from '../../../registry/resolveRenderer.js';
import schema from './schema.js';
import { sanitizeReportFilename } from '../../../downloadName.js';

// Keep the render's own deadline below config.requestTimeout so a slow render
// aborts and answers before the HTTP layer times out the whole request.
const TIMEOUT_MARGIN_MS = 2000;
const MIN_TIMEOUT_MS = 1000;

// Render one page as a downloadable report document. This is the only request
// type that declares meta.appAccess, so it receives the `app` capability — the
// seam through which it reads the built page config, the app's own requests,
// and the build artifacts the headless render consumes.
async function RenderReport({ request, app }) {
  const { pageId } = request;
  const format = request.format ?? 'pdf';

  // A report may not render a report. renderDepth is 0 for the top-level request
  // and ≥ 1 when this resolver is reached from another report's own requests —
  // refuse loudly rather than recurse.
  if ((app.renderDepth ?? 0) > 0) {
    throw new Error(
      `Report for page '${pageId}' cannot be rendered from within another report.`
    );
  }

  // getPageConfig applies context.authorize and returns null for an unknown
  // page AND an unauthorized one, so this one generic error covers both — a
  // report can never become an existence oracle for pages its user cannot view.
  //
  // Auth model: in an interactive request the caller's session gates this the
  // same as loading the page in the browser. In a SYSTEM context (a scheduled or
  // webhook routine) authorize() passes for every page — the transport is the
  // authorization boundary, exactly as it is for a CallApi step in the same
  // context. A webhook whose routine renders a protected page therefore returns
  // it: that is the routine author's call, so gate the webhook, not the report.
  const pageConfig = await app.getPageConfig({ pageId, urlQuery: request.urlQuery });
  if (type.isNone(pageConfig)) {
    throw new Error(`Report cannot be rendered for page '${pageId}'.`);
  }

  const deserializedPageConfig = serializer.deserialize(pageConfig);
  // Per-block `report:` options (exclude / sheetName / pageBreakBefore) live on
  // the built page JSON; read them here before the engine consumes it.
  const reportOptions = collectReportOptions(deserializedPageConfig);

  const [blockMetas, lowdefyGlobal, stylesheets] = await Promise.all([
    app.readConfigFile('plugins/blockMetas.json'),
    app.readConfigFile('global.json'),
    getReportStylesheet({ readConfigFile: app.readConfigFile }),
  ]);

  const result = await generateReport({
    // getPageConfig serializes for JSON transfer; the engine consumes the
    // runtime artifact, so the deserialized form is used for evaluation.
    pageConfig: deserializedPageConfig,
    format,
    reportOptions,
    snapshot: { urlQuery: request.urlQuery, input: request.input, state: request.state },
    // No user means a scheduled (system) render — the plugin's own _user guard
    // then fails fast on any page that reads _user.
    invocation: app.user ? 'user' : 'system',
    callRequest: app.callRequest,
    operators: app.clientOperators,
    jsMap: app.clientJsMap,
    blockMetas: blockMetas ?? {},
    registry: resolveRenderer({ blocksStatic: app.blocksStatic }),
    icons: app.icons ?? {},
    stylesheets,
    user: app.user ?? null,
    lowdefyGlobal: lowdefyGlobal ?? {},
    serverUrl: app.origin,
    origin: app.origin,
    logger: app.logger,
    timeoutMs: Math.max(app.requestTimeout - TIMEOUT_MARGIN_MS, MIN_TIMEOUT_MS),
  });

  // The platform's file envelope, matching AwsS3GetObject: base64 content so it
  // survives JSON serialization to the browser (the DownloadFile action) or to
  // the next routine step (an email connection). A requested filename that
  // sanitizes away to nothing falls back to the generated one.
  return {
    name: sanitizeReportFilename(request.filename) || result.filename,
    size: result.buffer.length,
    type: result.contentType,
    content: result.buffer.toString('base64'),
  };
}

RenderReport.schema = schema;
RenderReport.meta = {
  appAccess: true,
  checkRead: true,
  checkWrite: false,
};

export default RenderReport;
