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

import { FONT_FAMILY, SYMBOL_FONT_FAMILY } from '../../fonts/fonts.js';
import collectBuffer from './collectBuffer.js';
import { PdfPrinter, URLResolver, virtualFileSystem } from './pdfmakeModules.js';
import registerFonts, { FONT_FILES, SYMBOL_FONT_FILES } from './registerFonts.js';
import resolveImages from './resolveImages.js';
import toPdfMake from './toPdfMake.js';

/**
 * Render IR nodes to a PDF Buffer.
 *
 * @param {object[]} nodes IR nodes.
 * @param {object} [report] Page-level options (see `toPdfMake`).
 * @param {object} [options] `now` (Date) fixes the footer timestamp; `origin`,
 *   `publicDirectory` and `logger` are threaded to the image resolver.
 * @returns {Promise<Buffer>} the PDF file bytes.
 */
async function renderPdfBuffer(nodes, report = {}, options = {}) {
  const resolved = await resolveImages(nodes, {
    origin: options.origin,
    publicDirectory: options.publicDirectory,
    logger: options.logger,
  });
  const docDefinition = toPdfMake(resolved, report, options);
  registerFonts();
  const fontDescriptors = {
    [FONT_FAMILY]: { ...FONT_FILES },
    [SYMBOL_FONT_FAMILY]: { ...SYMBOL_FONT_FILES },
  };
  const urlResolver = new URLResolver(virtualFileSystem);
  const printer = new PdfPrinter(fontDescriptors, virtualFileSystem, urlResolver, undefined);
  const pdfKitDoc = await printer.createPdfKitDocument(docDefinition);
  return collectBuffer(pdfKitDoc);
}

export default renderPdfBuffer;
