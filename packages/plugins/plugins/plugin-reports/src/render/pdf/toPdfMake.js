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

/**
 * The IR -> pdfmake translation. Block `static` renderers emit IR nodes; the
 * modules in this directory turn the closed IR into a pdfmake document
 * definition and, server-side, into a PDF Buffer. Nothing else in the pipeline
 * depends on pdfmake — page-break policy, fonts, and column widths all live
 * here.
 *
 * `toPdfMake` is a pure IR -> docDefinition mapping so it can be tested at the
 * object level with no PDF bytes. `renderPdfBuffer` performs the byte step. Both
 * are exported from this module, with `resolveImages` and `contentWidthOf`, so
 * callers have one import for the PDF side.
 */

import { validateNodes } from '../../ir/nodes.js';
import { FONT_FAMILY } from '../../fonts/fonts.js';
import {
  PAGE_MARGINS,
  contentHeightOf,
  contentWidthOf,
  orientationOf,
  pageSizeOf,
} from '../geometry.js';
import assembleContent from './assembleContent.js';
import buildFooter from './buildFooter.js';
import buildHeader from './buildHeader.js';
import renderPdfBuffer from './renderPdfBuffer.js';
import resolveImages from './resolveImages.js';

/**
 * Translate IR nodes to a pdfmake document definition.
 *
 * @param {object[]} nodes IR nodes (validated here; throws ConfigError on an
 *   unknown kind).
 * @param {object} [report] Page-level options, already operator-evaluated:
 *   `title`, `size` ('A4' | 'letter'), `orientation` ('portrait' | 'landscape'),
 *   `header` (string; defaults to the title), `footer` (string).
 * @param {object} [options] `now` (Date) fixes the footer timestamp for tests;
 *   `logger` receives the markdown translator's warnings.
 * @returns {object} a pdfmake docDefinition.
 */
function toPdfMake(nodes, report = {}, options = {}) {
  validateNodes(nodes);

  const ctx = { contentWidth: contentWidthOf(report), logger: options.logger };
  const content = assembleContent(nodes, ctx, contentHeightOf(report));

  const headerText = report.header ?? report.title;
  const header = buildHeader(headerText);
  const footer = buildFooter(report.footer, options.now ?? new Date());

  const docDefinition = {
    info: { ...(report.title !== undefined ? { title: report.title } : {}) },
    pageSize: pageSizeOf(report).name,
    pageOrientation: orientationOf(report),
    pageMargins: PAGE_MARGINS,
    defaultStyle: { font: FONT_FAMILY, fontSize: 10 },
    content,
    footer,
  };
  if (header !== undefined) {
    docDefinition.header = header;
  }
  return docDefinition;
}

export default toPdfMake;
export { toPdfMake, renderPdfBuffer, resolveImages, contentWidthOf };
