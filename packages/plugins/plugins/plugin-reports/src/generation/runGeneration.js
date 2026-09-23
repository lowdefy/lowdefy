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

import collectMountEvents from '../collectMountEvents.js';
import evaluatePage from '../evaluatePage/evaluatePage.js';
import evaluateReportChrome from './evaluateReportChrome.js';
import FORMATS from './formats.js';
import { fonts } from '../fonts/fonts.js';
import createHtmlRenderer from '../render/html/createHtmlRenderer.js';
import { renderPdfBuffer, contentWidthOf } from '../render/pdf/toPdfMake.js';
import throwIfAborted from './throwIfAborted.js';
import toXlsx from '../render/xlsx/toXlsx.js';
import walkBlocks from '../render/walkBlocks.js';

function hasWarnings(warnings) {
  return Object.values(warnings).some((list) => list.length > 0);
}

// One generation, from built page config to document bytes: evaluate the page
// headlessly, walk the evaluated tree into IR, translate to the requested
// format. The caller (generateReport) owns the slot and the deadline; this runs
// inside both and checks the abort signal at each phase boundary.
async function runGeneration({
  pageConfig,
  format,
  snapshot = {},
  reportOptions = {},
  invocation,
  callRequest,
  operators,
  jsMap,
  blockMetas,
  registry = {},
  icons = {},
  stylesheets,
  user,
  lowdefyGlobal,
  serverUrl,
  origin,
  publicDirectory,
  logger,
  now,
  signal,
}) {
  const pageId = pageConfig?.pageId ?? pageConfig?.id;

  const spec = FORMATS[format];
  if (!spec) {
    // The caller asked for something the config surface does not offer, so this
    // is a ConfigError like any other bad config value — the routes answer 400.
    throw new ConfigError(
      `Report format '${format}' is not supported for page '${pageId}'. Use 'pdf' or 'xlsx'.`
    );
  }
  throwIfAborted(signal);

  const mountEvents = collectMountEvents(pageConfig);

  const {
    context,
    warnings: skippedActions,
    assertUserNotEvaluated,
  } = await evaluatePage({
    pageConfig,
    seed: snapshot,
    invocation,
    callRequest,
    operators,
    jsMap,
    blockMetas,
    user,
    lowdefyGlobal,
    serverUrl,
    logger,
    signal,
  });
  throwIfAborted(signal);

  const report = evaluateReportChrome({ context, pageConfig, pageId });
  // report.title/header/footer are parsed with the same operators as the page,
  // so a system render whose only _user sits in the report chrome would slip
  // past the per-phase guards inside evaluatePage (they run before this). Assert
  // once more here, before any document bytes exist.
  assertUserNotEvaluated();

  const renderContext = {
    logger,
    icons,
    renderHtml: createHtmlRenderer({ fonts, stylesheets, logger }),
    contentWidth: contentWidthOf(report),
    signal,
  };

  const walked = await walkBlocks(context, registry, reportOptions, renderContext);
  throwIfAborted(signal);
  const skippedBlockTypes = walked.warnings;
  const renderErrors = walked.renderErrors ?? [];

  let buffer;
  if (format === 'pdf') {
    buffer = await renderPdfBuffer(walked.nodes, report, { now, origin, publicDirectory, logger });
  } else {
    // format === 'xlsx' — project the same IR's table nodes into a workbook.
    buffer = await toXlsx(walked.nodes);
  }

  const warnings = { skippedActions, skippedBlockTypes, renderErrors, mountEvents };

  if (logger && hasWarnings(warnings)) {
    logger.warn(
      { pageId, format, warnings },
      `Report for page '${pageId}' generated with warnings: ` +
        `${skippedActions.length} skipped action(s), ` +
        `${skippedBlockTypes.length} unsupported block type(s), ` +
        `${renderErrors.length} block(s) that failed to render, ` +
        `${mountEvents.length} block(s) with onMount events that do not run in a report` +
        (mountEvents.length > 0 ? ` (${mountEvents.join(', ')}); load report data in onInit` : '') +
        '.'
    );
  }

  return {
    buffer,
    contentType: spec.contentType,
    filename: `${pageId}.${spec.ext}`,
    warnings,
  };
}

export default runGeneration;
