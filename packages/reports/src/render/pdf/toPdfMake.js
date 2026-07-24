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
 * The one module that knows pdfmake. Block `static` renderers emit IR nodes;
 * this translator turns the closed IR into a pdfmake document definition and,
 * server-side, into a PDF Buffer. Nothing else in the pipeline depends on
 * pdfmake — page-break policy, fonts, and column widths all live here.
 *
 * `toPdfMake` is a pure IR -> docDefinition mapping so it can be tested at the
 * object level with no PDF bytes. `renderPdfBuffer` performs the byte step.
 */

// These pdfmake modules are CommonJS. Under Node's ESM interop a default import
// binds to `module.exports`, which itself carries the real value on `.default`
// (the double-default gotcha), so unwrap defensively.
import PrinterModule from 'pdfmake/js/Printer.js';
import URLResolverModule from 'pdfmake/js/URLResolver.js';
import virtualFileSystemModule from 'pdfmake/js/virtual-fs.js';

import { validateNodes } from '../../ir/nodes.js';
import { fonts, FONT_FAMILY } from '../../fonts/fonts.js';
import { resolveImage } from '../resolveImage.js';

const PdfPrinter = PrinterModule.default ?? PrinterModule;
const URLResolver = URLResolverModule.default ?? URLResolverModule;
const virtualFileSystem = virtualFileSystemModule.default ?? virtualFileSystemModule;

// --- Page geometry ----------------------------------------------------------
// Sizes in PostScript points. Margins are fixed by decision, not configurable
// (design: no per-report margin config until a concrete need exists). Top and
// bottom leave room for the header and footer bands.

const PAGE_SIZES = {
  a4: { name: 'A4', width: 595.28, height: 841.89 },
  letter: { name: 'LETTER', width: 612, height: 792 },
};

const PAGE_MARGINS = [40, 60, 40, 50]; // [left, top, right, bottom]

/**
 * Content width in points for a report's page geometry: the page width for the
 * chosen size/orientation minus the left and right margins. The walker sizes
 * its columns against this, so generation shares one source of truth with the
 * PDF translator rather than duplicating the constants.
 *
 * @param {object} [report] `size` ('A4' | 'letter'), `orientation`
 *   ('portrait' | 'landscape').
 * @returns {number} content width in PostScript points.
 */
export function contentWidthOf(report = {}) {
  const size = PAGE_SIZES[String(report.size ?? 'A4').toLowerCase()] ?? PAGE_SIZES.a4;
  const orientation = report.orientation === 'landscape' ? 'landscape' : 'portrait';
  const pageWidth = orientation === 'landscape' ? size.height : size.width;
  return pageWidth - PAGE_MARGINS[0] - PAGE_MARGINS[2];
}

// --- Text styling ------------------------------------------------------------

const HEADING_SIZES = { 1: 22, 2: 17, 3: 14, 4: 12 };

// `tint` hints (e.g. an Alert severity) mapped to a text colour. Unknown tints
// fall through with no colour.
const TINT_COLORS = {
  error: '#cf1322',
  warning: '#d46b08',
  success: '#389e0d',
  info: '#0958d9',
};

const MUTED = '#8c8c8c';
const RULE_COLOR = '#d9d9d9';
const HEADER_FILL = '#f5f5f5';

// --- Cell text ---------------------------------------------------------------

/** PDF cell text is `formatted ?? value`, with null/undefined shown as blank. */
function cellText(cell) {
  const raw = cell.formatted ?? cell.value;
  return raw === null || raw === undefined ? '' : String(raw);
}

// --- Node translation --------------------------------------------------------

function translateHeading(node) {
  return {
    text: node.text,
    fontSize: HEADING_SIZES[node.level] ?? HEADING_SIZES[4],
    bold: true,
    margin: [0, 8, 0, 4],
  };
}

function translateText(node) {
  const color = node.tint !== undefined ? TINT_COLORS[node.tint] : undefined;
  return {
    text: node.text,
    margin: [0, 0, 0, 6],
    ...(color !== undefined ? { color } : {}),
  };
}

function translateSvg(node) {
  return {
    svg: node.svg,
    width: node.width,
    height: node.height,
    unbreakable: true,
    margin: [0, 0, 0, 8],
  };
}

function translateTable(node) {
  const columnCount = node.header?.length ?? node.rows?.[0]?.length ?? 0;
  const headerRow = (node.header ?? []).map((cell) => ({
    text: cellText(cell),
    bold: true,
    fillColor: HEADER_FILL,
  }));
  const dataRows = (node.rows ?? []).map((dataRow) =>
    (dataRow ?? []).map((cell) => ({ text: cellText(cell) }))
  );
  return {
    margin: [0, 0, 0, 8],
    table: {
      headerRows: 1,
      widths: Array(columnCount).fill('*'), // star columns -> full content width
      body: [headerRow, ...dataRows],
    },
    layout: 'lightHorizontalLines',
  };
}

function translateStat(node) {
  return {
    unbreakable: true,
    margin: [0, 0, 0, 8],
    stack: [
      { text: node.label, fontSize: 9, color: MUTED },
      { text: String(node.value), fontSize: 18, bold: true },
    ],
  };
}

function translateRow(node, ctx) {
  const children = node.children ?? [];
  const widths = node.widths ?? [];
  return {
    margin: [0, 0, 0, 8],
    columnGap: 8,
    // A child may translate to null (a skipped image); drop its column and keep
    // the remaining columns at their original fractions.
    columns: children
      .map((child, index) => {
        const translated = translateNode(child, ctx);
        if (translated === null) return null;
        const fraction = widths[index] ?? 1 / children.length;
        return { ...translated, width: `${fraction * 100}%` };
      })
      .filter((column) => column !== null),
  };
}

function translateStack(node, ctx) {
  return {
    margin: [0, 0, 0, 8],
    stack: (node.children ?? [])
      .map((child) => translateNode(child, ctx))
      .filter((child) => child !== null),
  };
}

function translateDivider(_node, ctx) {
  return {
    margin: [0, 4, 0, 8],
    canvas: [
      {
        type: 'line',
        x1: 0,
        y1: 0,
        x2: ctx.contentWidth,
        y2: 0,
        lineWidth: 0.5,
        lineColor: RULE_COLOR,
      },
    ],
  };
}

function translateSpacer(node) {
  // An offset: an empty column sized to its fraction. `width` is ignored by
  // pdfmake outside a `columns` context, so a standalone spacer is a no-op gap.
  return { text: '', width: `${(node.width ?? 0) * 100}%` };
}

/**
 * Translate a resolved `image` node. The `resolveImages` pre-pass attaches a
 * base64 `data` URL to every image whose bytes were acquired; an image without
 * one failed resolution and is skipped (returns null) so the report still
 * renders. Explicit `width`/`height` (points) win; with neither set the image
 * keeps its natural size but is capped to the content width via `maxWidth`,
 * which pdfmake clamps without upscaling.
 */
function translateImage(node, ctx) {
  if (typeof node.data !== 'string') return null;
  const translated = { image: node.data, unbreakable: true, margin: [0, 0, 0, 8] };
  const hasWidth = typeof node.width === 'number';
  const hasHeight = typeof node.height === 'number';
  if (hasWidth) translated.width = node.width;
  if (hasHeight) translated.height = node.height;
  if (!hasWidth && !hasHeight) translated.maxWidth = ctx.contentWidth;
  return translated;
}

/**
 * Translate one IR node to a pdfmake node. Recurses through `row`/`stack`
 * children. `ctx` carries the content width (points) for width-aware nodes.
 * Returns null for a node that should be skipped (an unresolved image).
 */
function translateNode(node, ctx) {
  switch (node.kind) {
    case 'heading':
      return translateHeading(node);
    case 'text':
      return translateText(node);
    case 'svg':
      return translateSvg(node);
    case 'table':
      return translateTable(node);
    case 'stat':
      return translateStat(node);
    case 'row':
      return translateRow(node, ctx);
    case 'stack':
      return translateStack(node, ctx);
    case 'divider':
      return translateDivider(node, ctx);
    case 'spacer':
      return translateSpacer(node);
    case 'markdown':
      throw new Error("Report IR node 'markdown' is not yet translated to PDF (task 15).");
    case 'image':
      return translateImage(node, ctx);
    default:
      // validateNodes runs first, so an unknown kind should never reach here.
      throw new Error(`Report IR node kind '${node.kind}' cannot be translated to PDF.`);
  }
}

/** Top-level nodes may carry a `pageBreakBefore` flag from the walker. */
function translateTopNode(node, ctx) {
  const translated = translateNode(node, ctx);
  if (translated === null) return null; // a skipped image
  if (node.pageBreakBefore) {
    translated.pageBreak = 'before';
  }
  return translated;
}

// --- Page chrome -------------------------------------------------------------

function buildHeader(headerText) {
  if (!headerText) return undefined;
  return () => ({
    text: headerText,
    margin: [PAGE_MARGINS[0], 24, PAGE_MARGINS[2], 0],
    fontSize: 9,
    color: MUTED,
  });
}

function buildFooter(footerText, generatedAt) {
  const timestamp = `Generated: ${generatedAt.toISOString()}`;
  return (currentPage, pageCount) => ({
    margin: [PAGE_MARGINS[0], 12, PAGE_MARGINS[2], 0],
    fontSize: 8,
    color: MUTED,
    columns: [
      { text: footerText ?? '', alignment: 'left' },
      { text: timestamp, alignment: 'center' },
      { text: `${currentPage} / ${pageCount}`, alignment: 'right' },
    ],
  });
}

// --- Public: IR -> docDefinition (pure) --------------------------------------

/**
 * Translate IR nodes to a pdfmake document definition.
 *
 * @param {object[]} nodes IR nodes (validated here; throws ConfigError on an
 *   unknown kind).
 * @param {object} [report] Page-level options, already operator-evaluated:
 *   `title`, `size` ('A4' | 'letter'), `orientation` ('portrait' | 'landscape'),
 *   `header` (string; defaults to the title), `footer` (string).
 * @param {object} [options] `now` (Date) fixes the footer timestamp for tests.
 * @returns {object} a pdfmake docDefinition.
 */
export function toPdfMake(nodes, report = {}, options = {}) {
  validateNodes(nodes);

  const size = PAGE_SIZES[String(report.size ?? 'A4').toLowerCase()] ?? PAGE_SIZES.a4;
  const orientation = report.orientation === 'landscape' ? 'landscape' : 'portrait';
  const contentWidth = contentWidthOf(report);

  const ctx = { contentWidth };
  const content = nodes
    .map((node) => translateTopNode(node, ctx))
    .filter((node) => node !== null);

  const headerText = report.header ?? report.title;
  const header = buildHeader(headerText);
  const footer = buildFooter(report.footer, options.now ?? new Date());

  const docDefinition = {
    info: { ...(report.title !== undefined ? { title: report.title } : {}) },
    pageSize: size.name,
    pageOrientation: orientation,
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

// --- Public: docDefinition -> Buffer (byte step) -----------------------------

// The bundled Roboto faces, registered once into pdfmake's virtual filesystem.
// Buffers cannot be passed directly as font descriptor values — the Printer's
// URL resolver treats non-string descriptor values as URL objects and would
// discard them — so we store the Buffers as virtual files and reference them by
// path. pdfmake reads the Buffer back from the VFS when it embeds the font.
const FONT_FILES = {
  normal: 'Roboto-Regular.ttf',
  bold: 'Roboto-Bold.ttf',
  italics: 'Roboto-Italic.ttf',
  bolditalics: 'Roboto-BoldItalic.ttf',
};

let fontsRegistered = false;

function registerFonts() {
  if (fontsRegistered) return;
  virtualFileSystem.writeFileSync(FONT_FILES.normal, fonts.regular);
  virtualFileSystem.writeFileSync(FONT_FILES.bold, fonts.bold);
  virtualFileSystem.writeFileSync(FONT_FILES.italics, fonts.italic);
  virtualFileSystem.writeFileSync(FONT_FILES.bolditalics, fonts.boldItalic);
  fontsRegistered = true;
}

// --- Image resolution pre-pass -----------------------------------------------

/**
 * Acquire bytes for every `image` node before the synchronous translation.
 * `toPdfMake` is a pure IR -> docDefinition mapping, but image acquisition is
 * async (disk reads, guarded fetches), so it happens here first. Each image is
 * routed through the one central `resolveImage`; a success attaches a base64
 * `data` URL to the node, a failure leaves the node unresolved (a warning is
 * logged by the resolver) and the translator skips it. Returns a new node list;
 * inputs are not mutated.
 *
 * @param {object[]} nodes IR nodes.
 * @param {object} [opts] `publicDir` (public assets root), `logger`.
 * @returns {Promise<object[]>} nodes with resolved images carrying `data`.
 */
export async function resolveImages(nodes, { publicDir, logger } = {}) {
  return Promise.all(
    (nodes ?? []).map(async (node) => {
      if (node.kind === 'image') {
        const resolved = await resolveImage({ src: node.src, publicDir, logger });
        if (resolved === null) return node;
        const data = `data:${resolved.mime};base64,${resolved.buffer.toString('base64')}`;
        return { ...node, data };
      }
      if (node.kind === 'row' || node.kind === 'stack') {
        return { ...node, children: await resolveImages(node.children, { publicDir, logger }) };
      }
      return node;
    })
  );
}

function collectBuffer(pdfKitDoc) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    pdfKitDoc.on('data', (chunk) => chunks.push(chunk));
    pdfKitDoc.on('end', () => resolve(Buffer.concat(chunks)));
    pdfKitDoc.on('error', reject);
    pdfKitDoc.end();
  });
}

/**
 * Render IR nodes to a PDF Buffer.
 *
 * @param {object[]} nodes IR nodes.
 * @param {object} [report] Page-level options (see `toPdfMake`).
 * @param {object} [options] `now` (Date) fixes the footer timestamp;
 *   `publicDir` (public assets root) and `logger` are threaded to the image
 *   resolver.
 * @returns {Promise<Buffer>} the PDF file bytes.
 */
export async function renderPdfBuffer(nodes, report = {}, options = {}) {
  const resolved = await resolveImages(nodes, {
    publicDir: options.publicDir,
    logger: options.logger,
  });
  const docDefinition = toPdfMake(resolved, report, options);
  registerFonts();
  const fontDescriptors = { [FONT_FAMILY]: { ...FONT_FILES } };
  const urlResolver = new URLResolver(virtualFileSystem);
  const printer = new PdfPrinter(fontDescriptors, virtualFileSystem, urlResolver, undefined);
  const pdfKitDoc = await printer.createPdfKitDocument(docDefinition);
  return collectBuffer(pdfKitDoc);
}
