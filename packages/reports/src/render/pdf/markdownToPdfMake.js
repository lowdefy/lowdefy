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
 * Translation of the `markdown` IR node: markdown source -> pdfmake content.
 *
 * Parsing uses `remark-parse` + `remark-gfm` — the same parser family
 * react-markdown runs on the client — so a document and the live page agree on
 * what the markdown means. The mdast walk is a pure function
 * (`mdastToPdfMake`), so the mapping is tested at the object level with no PDF
 * bytes; only `markdownToPdfMake` touches a logger.
 *
 * Two deliberate limits:
 *
 *   - **Raw HTML is ignored.** An `html` mdast node contributes nothing, and one
 *     warning is logged per markdown node (not per html node) naming the count.
 *     Custom HTML belongs in the Html block, which renders it properly, rather
 *     than being half-interpreted by a second renderer.
 *   - **Code renders in a code style, not a monospaced face.** Reports bundle
 *     one family (Roboto, four faces); registering a second family for fenced
 *     code is not worth the ~170 KB per document until a concrete need appears.
 *     Code is set apart by colour and a tinted background instead, and leading
 *     whitespace is preserved so indented code keeps its shape.
 */

import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';

import { resolveImage } from '../resolveImage.js';
import { dividerContent, headingStyle, HEADER_FILL } from './styles.js';

// Frozen once at module load: `parse` is called per markdown node and a frozen
// processor is reusable and cheap.
const processor = unified().use(remarkParse).use(remarkGfm).freeze();

/** Parse markdown source to an mdast tree (GFM enabled). */
export function parseMarkdown(markdown) {
  return processor.parse(String(markdown ?? ''));
}

// --- Style constants ---------------------------------------------------------

const PARAGRAPH_MARGIN = [0, 0, 0, 6];
// A4 portrait content width, for a caller that supplied no geometry.
const DEFAULT_CONTENT_WIDTH = 515.28;
const BLOCK_MARGIN = [0, 0, 0, 8];
const CODE_COLOR = '#c41d7f';
const CODE_BACKGROUND = '#f5f5f5';
const LINK_COLOR = '#0958d9';
const QUOTE_COLOR = '#595959';

const CODE_TEXT = { color: CODE_COLOR, background: CODE_BACKGROUND };

// --- Inline mapping ----------------------------------------------------------

/**
 * Collect the document's link definitions (`[id]: https://…`) as identifier ->
 * url, so reference-style links and images (`[text][id]`, `![alt][id]`) resolve
 * to the same thing they do on the page.
 */
function collectDefinitions(tree, definitions = {}) {
  if (tree?.type === 'definition' && typeof tree.url === 'string') {
    definitions[tree.identifier] = tree.url;
  }
  (tree?.children ?? []).forEach((child) => collectDefinitions(child, definitions));
  return definitions;
}

/** The url an `image`/`imageReference` or `link`/`linkReference` node points at. */
function urlOf(node, state) {
  if (typeof node.url === 'string') return node.url;
  return state.definitions[node.identifier];
}

/** Collapse the newlines of soft line breaks to spaces. */
function softWrap(value) {
  return String(value ?? '').replace(/\r?\n/g, ' ');
}

/** Add a decoration to a style, keeping any decoration already there. */
function withDecoration(style, decoration) {
  const current = style.decoration;
  if (current === undefined) return { ...style, decoration };
  const list = Array.isArray(current) ? current : [current];
  return { ...style, decoration: [...list, decoration] };
}

/**
 * Map one inline mdast node to pdfmake text items, carrying the accumulated
 * style down so nested marks compose (`**_bold italic_**` gets both).
 */
function inlineNode(node, style, state) {
  switch (node.type) {
    case 'text':
      // A soft line break (a newline inside a paragraph) is whitespace, exactly
      // as the client's HTML renders it; pdfmake would treat the newline as a
      // hard break. Only an explicit `break` node breaks the line.
      return [{ text: softWrap(node.value), ...style }];
    case 'strong':
      return inlineNodes(node.children, { ...style, bold: true }, state);
    case 'emphasis':
      return inlineNodes(node.children, { ...style, italics: true }, state);
    case 'delete':
      return inlineNodes(node.children, withDecoration(style, 'lineThrough'), state);
    case 'inlineCode':
      return [{ text: node.value, ...style, ...CODE_TEXT }];
    case 'link':
    case 'linkReference': {
      const url = urlOf(node, state);
      // A reference with no definition is not a link; its text still shows.
      if (url === undefined) return inlineNodes(node.children, style, state);
      return inlineNodes(
        node.children,
        withDecoration({ ...style, link: url, color: LINK_COLOR }, 'underline'),
        state
      );
    }
    case 'break':
      return [{ text: '\n', ...style }];
    case 'image':
    case 'imageReference':
      // An image nested inside other inline content — a linked badge, say —
      // cannot be embedded: pdfmake text arrays hold text only. Its alt text
      // stands in, keeping the link and styling around it.
      return typeof node.alt === 'string' && node.alt !== '' ? [{ text: node.alt, ...style }] : [];
    case 'html':
      state.htmlNodes += 1;
      return [];
    default:
      // Anything else with children (an inline footnote, a plugin's own node)
      // contributes its text; anything with a raw value contributes that. A node
      // with neither — a `definition`, a `footnoteReference` — is invisible,
      // which is what it is on the page too.
      if (Array.isArray(node.children)) return inlineNodes(node.children, style, state);
      return typeof node.value === 'string' ? [{ text: softWrap(node.value), ...style }] : [];
  }
}

function inlineNodes(nodes, style, state) {
  return (nodes ?? []).flatMap((node) => inlineNode(node, style, state));
}

/**
 * Wrap inline items as a pdfmake text node. A single unstyled item collapses to
 * a plain string, so a plain paragraph is `{ text: 'Hello' }` rather than a
 * one-element array.
 */
function textContent(items, extra = {}) {
  if (items.length === 1 && Object.keys(items[0]).length === 1) {
    return { text: items[0].text, ...extra };
  }
  return { text: items, ...extra };
}

// --- Block mapping -----------------------------------------------------------

/**
 * A markdown image. The pre-pass (`resolveMarkdownImages`) has already acquired
 * the bytes; an image missing from the map failed resolution (the resolver
 * logged why) and is skipped so the report still renders. Markdown carries no
 * dimensions, so the image keeps its natural size capped to the content width.
 */
function imageContent(node, state) {
  const data = state.images[urlOf(node, state)];
  if (typeof data !== 'string') return [];
  return [
    {
      image: data,
      unbreakable: true,
      margin: BLOCK_MARGIN,
      ...(typeof state.contentWidth === 'number' ? { maxWidth: state.contentWidth } : {}),
    },
  ];
}

/**
 * A paragraph. Images cannot live inside a pdfmake text array, so a paragraph
 * mixing prose and images splits into alternating text and image nodes. Inside
 * a list item the bottom margin is dropped — the list supplies the spacing.
 */
function paragraphContent(node, state) {
  const out = [];
  let run = [];
  const margin = state.listDepth > 0 ? undefined : PARAGRAPH_MARGIN;
  const flush = () => {
    if (run.length === 0) return;
    out.push(textContent(run, margin === undefined ? {} : { margin }));
    run = [];
  };
  (node.children ?? []).forEach((child) => {
    if (child.type === 'image' || child.type === 'imageReference') {
      flush();
      out.push(...imageContent(child, state));
      return;
    }
    run.push(...inlineNode(child, {}, state));
  });
  flush();
  return out;
}

function headingBlock(node, state) {
  const items = inlineNodes(node.children, {}, state);
  if (items.length === 0) return [];
  const level = Math.min(Math.max(node.depth ?? 1, 1), 4);
  return [textContent(items, headingStyle(level))];
}

function codeBlock(node, state) {
  return [
    {
      text: node.value ?? '',
      ...CODE_TEXT,
      preserveLeadingSpaces: true,
      margin: state.listDepth > 0 ? [0, 2, 0, 2] : BLOCK_MARGIN,
    },
  ];
}

/**
 * A blockquote: the quoted blocks indented and tinted. pdfmake inherits style
 * properties down a stack, so the colour and italics reach the quoted text.
 */
function blockquoteBlock(node, state) {
  const children = blockNodes(node.children, state);
  if (children.length === 0) return [];
  return [{ stack: children, margin: [12, 0, 0, 8], color: QUOTE_COLOR, italics: true }];
}

/** Prefix a GFM task-list marker onto an item's first content node. */
function withTaskMarker(parts, checked) {
  const marker = checked ? '[x] ' : '[ ] ';
  const first = parts[0];
  if (first === undefined) return [{ text: marker }];
  if (typeof first.text === 'string') {
    return [{ ...first, text: `${marker}${first.text}` }, ...parts.slice(1)];
  }
  if (Array.isArray(first.text)) {
    return [{ ...first, text: [{ text: marker }, ...first.text] }, ...parts.slice(1)];
  }
  return [{ text: marker }, ...parts];
}

function listItemContent(item, state) {
  let parts = blockNodes(item.children, state);
  if (typeof item.checked === 'boolean') {
    parts = withTaskMarker(parts, item.checked);
  }
  if (parts.length === 0) return { text: '' };
  if (parts.length === 1) return parts[0];
  return { stack: parts };
}

/**
 * A list. `ordered` selects `ol`/`ul`; a list numbered from something other
 * than 1 keeps its start. Nesting falls out of the recursion: a nested list is
 * just another block inside its parent's list item.
 */
function listBlock(node, state) {
  const nested = { ...state, listDepth: state.listDepth + 1 };
  const items = (node.children ?? []).map((item) => listItemContent(item, nested));
  if (items.length === 0) return [];
  const key = node.ordered ? 'ol' : 'ul';
  const start =
    node.ordered && Number.isInteger(node.start) && node.start !== 1 ? node.start : undefined;
  return [
    {
      [key]: items,
      margin: state.listDepth > 0 ? [0, 2, 0, 2] : BLOCK_MARGIN,
      ...(start !== undefined ? { start } : {}),
    },
  ];
}

/**
 * A GFM table: the first row is the header, columns share the width evenly as
 * explicit points. Star columns would grow past the page margin around any long
 * unbreakable token (a url, an id), so fixed widths wrap instead — the same rule
 * `toPdfMake` applies to `table` nodes.
 */
function tableBlock(node, state) {
  const rows = node.children ?? [];
  if (rows.length === 0) return [];
  const columnCount = rows.reduce((max, row) => Math.max(max, (row.children ?? []).length), 0);
  if (columnCount === 0) return [];
  const align = node.align ?? [];

  const buildRow = (row, isHeader) => {
    const cells = (row.children ?? []).map((cell, index) => {
      const items = inlineNodes(cell.children, {}, state);
      const alignment = align[index] ?? undefined;
      return textContent(items.length === 0 ? [{ text: '' }] : items, {
        ...(isHeader ? { bold: true, fillColor: HEADER_FILL } : {}),
        ...(alignment ? { alignment } : {}),
      });
    });
    // pdfmake requires every body row to have the same cell count.
    while (cells.length < columnCount) {
      cells.push({ text: '', ...(isHeader ? { bold: true, fillColor: HEADER_FILL } : {}) });
    }
    return cells;
  };

  const [headerRow, ...bodyRows] = rows;
  // pdfmake's default cell padding is 4pt a side, so each column loses 8pt.
  const available = (state.contentWidth ?? DEFAULT_CONTENT_WIDTH) - columnCount * 8;
  return [
    {
      margin: BLOCK_MARGIN,
      table: {
        headerRows: 1,
        widths: Array(columnCount).fill(available / columnCount),
        body: [buildRow(headerRow, true), ...bodyRows.map((row) => buildRow(row, false))],
      },
      layout: 'lightHorizontalLines',
    },
  ];
}

/** Map one block-level mdast node to zero or more pdfmake content nodes. */
function blockNode(node, state) {
  switch (node.type) {
    case 'heading':
      return headingBlock(node, state);
    case 'paragraph':
      return paragraphContent(node, state);
    case 'code':
      return codeBlock(node, state);
    case 'blockquote':
      return blockquoteBlock(node, state);
    case 'list':
      return listBlock(node, state);
    case 'table':
      return tableBlock(node, state);
    case 'thematicBreak':
      return [dividerContent(state.contentWidth ?? 0)];
    case 'html':
      state.htmlNodes += 1;
      return [];
    default:
      // A block wrapper we do not style specially — a footnote definition, a
      // block a future remark plugin adds — contributes its children.
      return blockNodes(node.children, state);
  }
}

function blockNodes(nodes, state) {
  return (nodes ?? []).flatMap((node) => blockNode(node, state));
}

// --- Public: pure mdast -> pdfmake -------------------------------------------

/**
 * Map an mdast tree to pdfmake content. Pure: no logger, no I/O, no mutation of
 * the inputs.
 *
 * @param {object} tree An mdast root (from `parseMarkdown`).
 * @param {object} [options] `contentWidth` (points, sizes rules and caps image
 *   widths) and `images` (a markdown image url -> base64 data URL map from the
 *   resolution pre-pass).
 * @returns {{ content: object[], htmlNodes: number }} the pdfmake content nodes
 *   and how many raw-HTML nodes were ignored.
 */
export function mdastToPdfMake(tree, { contentWidth, images } = {}) {
  const state = {
    contentWidth,
    images: images ?? {},
    definitions: collectDefinitions(tree),
    listDepth: 0,
    htmlNodes: 0,
  };
  const content = blockNodes(tree?.children, state);
  return { content, htmlNodes: state.htmlNodes };
}

// --- Public: the image resolution pre-pass -----------------------------------

/**
 * Acquire bytes for every markdown image before the synchronous translation,
 * mirroring how `resolveImages` handles `image` nodes: acquisition is async, the
 * mapping is not. Every source routes through the one central `resolveImage`, so
 * markdown images obey exactly the same guardrails as an Img block. The parsed
 * tree is attached alongside the resolved images so the translation step does
 * not parse the same source twice.
 *
 * @param {object} node A `markdown` IR node.
 * @param {object} [opts] `publicDir` (public assets root), `logger`.
 * @returns {Promise<object>} a new node carrying `tree` and `images`.
 */
export async function resolveMarkdownImages(node, { publicDir, logger } = {}) {
  const tree = parseMarkdown(node.markdown);
  const definitions = collectDefinitions(tree);
  const urls = [];
  const collect = (mdastNode) => {
    if (mdastNode.type === 'image' || mdastNode.type === 'imageReference') {
      const url = urlOf(mdastNode, { definitions });
      if (typeof url === 'string' && !urls.includes(url)) urls.push(url);
    }
    (mdastNode.children ?? []).forEach(collect);
  };
  collect(tree);
  if (urls.length === 0) return { ...node, tree };

  const resolved = await Promise.all(
    urls.map(async (url) => {
      const image = await resolveImage({ src: url, publicDir, logger });
      if (image === null) return null;
      return [url, `data:${image.mime};base64,${image.buffer.toString('base64')}`];
    })
  );
  return { ...node, tree, images: Object.fromEntries(resolved.filter((entry) => entry !== null)) };
}

// --- Public: IR node -> pdfmake ----------------------------------------------

/**
 * Translate a `markdown` IR node to a single pdfmake node (a stack of the
 * mapped blocks), or null when the markdown renders nothing.
 *
 * @param {object} node A `markdown` IR node; `tree`/`images` are present when
 *   the pre-pass ran, and the source is parsed here otherwise.
 * @param {object} [ctx] `contentWidth` (points) and `logger`.
 * @returns {object|null} a pdfmake node, or null for empty markdown.
 */
export function markdownToPdfMake(node, ctx = {}) {
  const tree = node.tree ?? parseMarkdown(node.markdown);
  const { content, htmlNodes } = mdastToPdfMake(tree, {
    contentWidth: ctx.contentWidth,
    images: node.images,
  });
  if (htmlNodes > 0) {
    ctx.logger?.warn?.(
      { htmlNodes },
      `Report markdown: ${htmlNodes} raw HTML node(s) ignored. ` +
        'Markdown in a report renders markdown only — use an Html block for custom HTML.'
    );
  }
  if (content.length === 0) return null;
  return { stack: content };
}

export default markdownToPdfMake;
