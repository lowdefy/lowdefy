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
import { markdownToPdfMake, resolveMarkdownImages } from './markdownToPdfMake.js';
import { dividerContent, headingContent, HEADER_FILL, MUTED } from './styles.js';

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

// The gutter between the columns of a `row`. pdfmake takes the gutters out of the
// row's width before resolving column widths, so the translator has to subtract
// them too when it sizes a child against its column.
const COLUMN_GAP = 8;

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

// Heading sizes, the rule colour, the table header fill, and the muted grey live
// in `styles.js` — `markdownToPdfMake` maps markdown headings and rules through
// the same builders, so the two translators cannot drift.

// `tint` hints (e.g. an Alert severity) mapped to a text colour. Unknown tints
// fall through with no colour.
const TINT_COLORS = {
  error: '#cf1322',
  warning: '#d46b08',
  success: '#389e0d',
  info: '#0958d9',
};

// --- Cell text ---------------------------------------------------------------

/** PDF cell text is `formatted ?? value`, with null/undefined shown as blank. */
function cellText(cell) {
  const raw = cell.formatted ?? cell.value;
  return raw === null || raw === undefined ? '' : String(raw);
}

// --- Node translation --------------------------------------------------------

function translateHeading(node) {
  return headingContent({ text: node.text, level: node.level });
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

/**
 * A grid is worksheet data, so the document names it and its size instead of
 * printing it (see the `grid` node in ir/nodes.js). Without this line a section
 * heading would introduce nothing at all, which reads as a broken report.
 */
function translateGrid(node, ctx) {
  const rowCount = node.rows?.length ?? 0;
  const label = node.sheetName ? `'${node.sheetName}'` : 'This table';
  ctx.logger?.debug?.(
    { sheetName: node.sheetName, rows: rowCount },
    `Report grid ${label} (${rowCount} rows) is exported to xlsx, not rendered in the PDF.`
  );
  return {
    text: `${label} — ${rowCount} ${
      rowCount === 1 ? 'row' : 'rows'
    }, included in the Excel export.`,
    italics: true,
    color: MUTED,
    margin: [0, 0, 0, 8],
  };
}

/**
 * Columns divide the available width evenly, as explicit points rather than
 * pdfmake star columns: a star column is never narrower than its widest
 * unbreakable token, so one long email or id grows the whole table past the page
 * margin. Fixed widths wrap instead, which keeps every table on the page.
 */
function translateTable(node, ctx) {
  const columnCount = node.header?.length ?? node.rows?.[0]?.length ?? 0;
  const headerRow = (node.header ?? []).map((cell) => ({
    text: cellText(cell),
    bold: true,
    fillColor: HEADER_FILL,
  }));
  const dataRows = (node.rows ?? []).map((dataRow) =>
    (dataRow ?? []).map((cell) => ({ text: cellText(cell) }))
  );
  // pdfmake's default cell padding is 4pt a side, so each column loses 8pt.
  const available = ctx.contentWidth - columnCount * 8;
  return {
    margin: [0, 0, 0, 8],
    table: {
      headerRows: 1,
      widths: Array(columnCount).fill(available / Math.max(1, columnCount)),
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

/**
 * A row width entry as a pdfmake column width: a fraction becomes a percentage,
 * `'auto'` sizes to content, `'fill'` takes an equal share of the remainder
 * (pdfmake's star column).
 */
function columnWidth(width) {
  if (width === 'auto') return 'auto';
  if (width === 'fill') return '*';
  return `${width * 100}%`;
}

function translateRow(node, ctx) {
  const children = node.children ?? [];
  const widths = node.widths ?? [];
  // pdfmake takes the gaps out of the row before it resolves the column widths
  // (layoutBuilder subtracts `(gaps.length - 1) * columnGap`, then percentages are
  // taken of what is left), so a child sized against the full row is drawn a few
  // points into the gutter. Size against what the column will actually get. The
  // count is of children, not of surviving columns, so a row with a skipped image
  // over-reserves one gap — narrower than it needs to be, never wider.
  const gutters = Math.max(children.length - 1, 0) * COLUMN_GAP;
  const rowWidth = Math.max(ctx.contentWidth - gutters, 0);
  return {
    margin: [0, 0, 0, 8],
    columnGap: COLUMN_GAP,
    // A child may translate to null (a skipped image); drop its column and keep
    // the remaining columns at their original widths.
    columns: children
      .map((child, index) => {
        const width = widths[index] ?? 1 / children.length;
        // Narrow the context to the cell: a table or divider inside a row must
        // size to its column, not to the full page width. A content-sized or
        // filling column has no width until pdfmake lays the row out, so those
        // children keep the row's width as an upper bound.
        const cellWidth = typeof width === 'number' ? rowWidth * width : rowWidth;
        const translated = translateNode(child, { ...ctx, contentWidth: cellWidth });
        if (translated === null) return null;
        return { ...translated, width: columnWidth(width) };
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
  return dividerContent(ctx.contentWidth);
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
 * children. `ctx` carries the content width (points) for width-aware nodes and
 * the logger for the markdown translator's warnings. Returns null for a node
 * that should be skipped (an unresolved image, markdown that renders nothing).
 */
function translateNode(node, ctx) {
  switch (node.kind) {
    case 'heading':
      return translateHeading(node);
    case 'text':
      return translateText(node);
    case 'svg':
      return translateSvg(node);
    case 'grid':
      return translateGrid(node, ctx);
    case 'table':
      return translateTable(node, ctx);
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
      // Parsed and mapped by the one markdown translator; null when the
      // markdown renders nothing (empty or HTML-only source).
      return markdownToPdfMake(node, ctx);
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
  if (translated === null) return null; // a skipped image, or empty markdown
  if (node.pageBreakBefore) {
    translated.pageBreak = 'before';
  }
  return translated;
}

// --- Section grouping --------------------------------------------------------

/** A heading and a divider introduce what follows, so they travel with it. */
const SECTION_MARKERS = new Set(['heading', 'divider']);

// A heading is ~30pt with its margins; used to size a candidate group.
const MARKER_HEIGHT = 30;
// A chart-plus-heading group has to leave room for the rest of the page's flow,
// so only group when the pair takes at most this share of the page.
const GROUP_HEIGHT_LIMIT = 0.9;

// Unbreakable, but measurable only when the node declares a height: pdfmake sizes
// an image or a dimensionless svg from bytes it has not decoded yet. `Infinity`
// says "unbreakable and unmeasurable", which keeps the node out of a group instead
// of counting it as nothing — as zero, a row of natural-size images measured 40pt,
// cleared the group cap, and could become an unbreakable block taller than a page.
const declaredHeight = (node) => (typeof node.height === 'number' ? node.height + 8 : Infinity);

/**
 * The height a node takes when it cannot be split, or undefined when it flows
 * (text, markdown, tables) and so never strands the heading above it. `Infinity`
 * is the third answer — see `declaredHeight`.
 */
function unbreakableHeight(node) {
  switch (node.kind) {
    case 'svg':
      return declaredHeight(node);
    case 'image':
      return declaredHeight(node);
    case 'stat':
      return 40;
    case 'row':
      // One unmeasurable child makes the row unmeasurable, because Infinity wins
      // the max.
      return Math.max(40, ...(node.children ?? []).map((child) => unbreakableHeight(child) ?? 0));
    default:
      return undefined;
  }
}

/**
 * Assemble the top-level content, keeping each heading with the content it
 * introduces. A chart that does not fit the remaining space moves to the next
 * page whole (it is unbreakable), which used to leave its heading behind above a
 * blank half page. Grouping the pair in one unbreakable stack moves them
 * together.
 *
 * This is done here rather than with pdfmake's `pageBreakBefore` callback: that
 * callback decides from which nodes share a page, and a row whose children
 * overflow still counts as being on the heading's page, so the orphan goes
 * unnoticed. Grouping needs no such bookkeeping.
 *
 * Groups are capped at a share of the page: a heading plus something taller than
 * the page would otherwise become an unbreakable block that cannot be placed.
 */
function assembleContent(nodes, ctx, pageContentHeight) {
  const content = [];
  let markers = [];

  const flushMarkers = () => {
    content.push(...markers);
    markers = [];
  };

  for (const node of nodes) {
    const translated = translateTopNode(node, ctx);
    if (translated === null) continue;

    if (SECTION_MARKERS.has(node.kind)) {
      markers.push(translated);
      continue;
    }

    const height = unbreakableHeight(node);
    const fits =
      height !== undefined &&
      height + markers.length * MARKER_HEIGHT <= pageContentHeight * GROUP_HEIGHT_LIMIT;

    if (markers.length > 0 && fits) {
      // A page break asked for on the first marker belongs to the group.
      const [first, ...rest] = markers;
      const { pageBreak, ...head } = first;
      content.push({
        stack: [head, ...rest, translated],
        unbreakable: true,
        ...(pageBreak !== undefined ? { pageBreak } : {}),
      });
      markers = [];
      continue;
    }

    flushMarkers();
    content.push(translated);
  }

  flushMarkers();
  return content;
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
 * @param {object} [options] `now` (Date) fixes the footer timestamp for tests;
 *   `logger` receives the markdown translator's warnings.
 * @returns {object} a pdfmake docDefinition.
 */
export function toPdfMake(nodes, report = {}, options = {}) {
  validateNodes(nodes);

  const size = PAGE_SIZES[String(report.size ?? 'A4').toLowerCase()] ?? PAGE_SIZES.a4;
  const orientation = report.orientation === 'landscape' ? 'landscape' : 'portrait';
  const contentWidth = contentWidthOf(report);

  const ctx = { contentWidth, logger: options.logger };
  const pageHeight = orientation === 'landscape' ? size.width : size.height;
  const content = assembleContent(nodes, ctx, pageHeight - PAGE_MARGINS[1] - PAGE_MARGINS[3]);

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
 * Acquire bytes for every image before the synchronous translation. `toPdfMake`
 * is a pure IR -> docDefinition mapping, but image acquisition is async (disk
 * reads, guarded fetches), so it happens here first. Each image is routed
 * through the one central `resolveImage`; a success attaches a base64 `data` URL
 * to the node, a failure leaves the node unresolved (a warning is logged by the
 * resolver) and the translator skips it. A `markdown` node's images are
 * acquired the same way — its markdown is parsed here and the parsed tree is
 * attached with the resolved image map, so translation parses nothing twice.
 * Returns a new node list; inputs are not mutated.
 *
 * @param {object[]} nodes IR nodes.
 * @param {object} [opts] `origin` (the app's own origin, for relative paths), `logger`.
 * @returns {Promise<object[]>} nodes with resolved images carrying `data`.
 */
export async function resolveImages(nodes, { origin, logger } = {}) {
  return Promise.all(
    (nodes ?? []).map(async (node) => {
      if (node.kind === 'image') {
        const resolved = await resolveImage({ src: node.src, origin, logger });
        if (resolved === null) return node;
        const data = `data:${resolved.mime};base64,${resolved.buffer.toString('base64')}`;
        return { ...node, data };
      }
      if (node.kind === 'markdown') {
        return resolveMarkdownImages(node, { origin, logger });
      }
      if (node.kind === 'row' || node.kind === 'stack') {
        return { ...node, children: await resolveImages(node.children, { origin, logger }) };
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
 *   `origin` (the app's own origin) and `logger` are threaded to the image
 *   resolver.
 * @returns {Promise<Buffer>} the PDF file bytes.
 */
export async function renderPdfBuffer(nodes, report = {}, options = {}) {
  const resolved = await resolveImages(nodes, {
    origin: options.origin,
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
