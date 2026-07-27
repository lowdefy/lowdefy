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

import { serializer } from '@lowdefy/helpers';

import callRequest from '../request/callRequest.js';

// Collect the per-block `report:` options the build leaves on the built page
// JSON. The engine drops these keys during evaluation, so the map is extracted
// here from the raw config and passed to generateReport keyed by blockId. Walk
// every slot's blocks recursively; a block's own children live under its slots.
function collectReportOptions(block, map) {
  for (const slot of Object.values(block?.slots ?? {})) {
    for (const child of slot?.blocks ?? []) {
      if (child.report && child.blockId) {
        map[child.blockId] = child.report;
      }
      collectReportOptions(child, map);
    }
  }
}

/**
 * The one way a report is rendered: authorize the page, assemble the report seam
 * the server built on the context, and generate. Both triggers — the download
 * route and the RenderReport routine step — go through here, so page
 * authorization and the seam arguments can never drift apart between them.
 *
 * Returns null when the page does not exist or the caller may not view it; the
 * two cases are indistinguishable on purpose, so no caller becomes an existence
 * oracle. Generation failures (timeout, busy, bad format, `_user` on a system
 * render) throw and are mapped by the caller.
 *
 * @param {object} context Api context, with the `report` seam attached.
 * @param {object} options
 * @param {string} options.pageId
 * @param {'pdf'|'xlsx'} [options.format]
 * @param {object} [options.snapshot] `{ urlQuery, input, state }`
 * @param {'user'|'system'} [options.invocation]
 * @returns {Promise<null|{ buffer: Buffer, contentType: string, filename: string, warnings: object }>}
 */
async function renderReport(
  context,
  { pageId, format = 'pdf', snapshot = {}, invocation = 'user' }
) {
  // Existence-masking: an unknown page and a page the caller may not view both
  // return null. The authorize check is identical to viewing the page
  // (getPageConfig.js).
  const pageConfig = await context.readConfigFile(`pages/${pageId}.json`);
  if (!pageConfig || !context.authorize(pageConfig)) {
    return null;
  }

  // readConfigFile caches parsed artifacts — deep copy so the headless render
  // never mutates the shared cached config, and drop the auth key the engine
  // has no use for.
  // eslint-disable-next-line no-unused-vars
  const { auth, ...rest } = serializer.copy(pageConfig);

  const reportOptions = {};
  collectReportOptions(rest, reportOptions);

  const { report } = context;
  const lowdefyGlobal = (await context.readConfigFile('global.json')) || {};

  // Every page request runs through callRequest, so it passes the same
  // authorizeRequest gate as an interactive request — a report can never read
  // data from a request its invoker could not call in the browser. The engine
  // passes { actionId, blockId, pageId, payload, requestId }; callRequest reads
  // blockId/pageId/payload/requestId.
  return report.generateReport({
    pageConfig: rest,
    format,
    snapshot,
    reportOptions,
    invocation,
    callRequest: (args) => callRequest(context, args),
    operators: report.operators,
    jsMap: report.jsMap,
    blockMetas: report.blockMetas,
    registry: report.registry,
    stylesheets: report.stylesheets,
    user: context.session?.user ?? null,
    lowdefyGlobal,
    serverUrl: context.origin,
    publicDir: report.publicDir,
    logger: context.logger,
  });
}

export default renderReport;
