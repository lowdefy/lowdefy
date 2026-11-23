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

import isHiddenBelow from '../standIns/isHiddenBelow.js';
import { hasHidingClass, TEXT_WRITING } from '../standIns/matchHtmlText.js';
import isPlainText from './isPlainText.js';
import normalizeShownText from './normalizeShownText.js';

// Elements whose text nodes a browser's innerText reads with no break around them, unless their
// style or class lays them out otherwise (breaksLine).
const INLINE_TAGS = new Set([
  'A',
  'ABBR',
  'B',
  'BDI',
  'BDO',
  'CITE',
  'CODE',
  'DATA',
  'DEL',
  'DFN',
  'EM',
  'FONT',
  'I',
  'INS',
  'KBD',
  'LABEL',
  'MARK',
  'Q',
  'S',
  'SAMP',
  'SMALL',
  'SPAN',
  'STRONG',
  'SUB',
  'SUP',
  'TIME',
  'U',
  'VAR',
]);
// Elements innerText never reads.
const UNREAD_TAGS = new Set(['HEAD', 'NOSCRIPT', 'SCRIPT', 'STYLE', 'TEMPLATE']);
// Elements whose text innerText may or may not read: form controls draw their value, which
// innerText leaves out, and svg draws only some of its text.
const CONTROL_TAGS = new Set(['INPUT', 'OPTION', 'SELECT', 'SVG', 'TEXTAREA']);
// Classes that lay an element out as a block, a flex or grid box, or out of flow (Tailwind's, with
// or without a breakpoint), and the attributes block-utils' html css lays out as an inline flex
// box (createHtmlCss).
const LAYOUT_CLASS =
  /(^|:)(block|inline-block|flex|inline-flex|grid|inline-grid|table|table-.+|flow-root|list-item|contents|float-.+|absolute|fixed|sticky)$/;
const FLEX_CLASS = /(^|:)(flex|inline-flex|grid|inline-grid)$/;
const FLEX_ATTRIBUTES = ['data-avatar', 'data-lf-copy', 'data-status', 'data-tag'];
const TRANSFORM_CLASS = /(^|:)(uppercase|lowercase|capitalize)$/;
const PRE_CLASS = /(^|:)whitespace-(pre|pre-line|pre-wrap|break-spaces)$/;
// White space as CSS collapses it; a no-break space is not.
const CSS_SPACE = /[ \t\n\r\f]+/g;

function hasClass({ element, pattern }) {
  return [...(element.classList ?? [])].some((token) => pattern.test(token));
}

function isFlexBox(element) {
  return (
    /flex|grid/.test(element.style?.display ?? '') ||
    hasClass({ element, pattern: FLEX_CLASS }) ||
    FLEX_ATTRIBUTES.some((name) => element.hasAttribute(name))
  );
}

// Whether innerText may put a break between this element's text and the text around it: any
// element but an inline one, an inline one laid out otherwise by its style or class, and any
// child of a flex or grid box, which lays its children out as blocks.
function breaksLine(element) {
  if (!INLINE_TAGS.has(element.tagName)) return true;
  const { style } = element;
  if (style?.display || style?.float || style?.position) return true;
  if (hasClass({ element, pattern: LAYOUT_CLASS })) return true;
  const parent = element.parentElement;
  return parent !== null && isFlexBox(parent);
}

function keepsSpace(element) {
  return (
    element.tagName === 'PRE' ||
    /^(pre|break-spaces)/.test(element.style?.whiteSpace ?? '') ||
    hasClass({ element, pattern: PRE_CLASS })
  );
}

function transformsCase(element) {
  return (
    !['', 'none'].includes(element.style?.textTransform ?? '') ||
    hasClass({ element, pattern: TRANSFORM_CLASS })
  );
}

// The text an html string shows, as far as the html says without laying it out (root is the
// parsed html, loadHtmlDom's parse). Returns { runs, units, open }:
// - runs: the stretches of text a browser draws with no break inside them, each { text, pre }:
//   the text nodes between two elements that may break a line, joined. A run leaves out text
//   that may not show or may show changed: hidden by the html or by a class the page's CSS may
//   hide by, inside an element whose text an html enhancer writes, or under a case transform.
//   pre says the run keeps its white space as written (a <pre>, or a white-space style or class);
//   otherwise a browser collapses it.
// - units: the html's text as a browser's innerText may read it, with white space and case taken
//   out (normalizeShownText): once with the elements a class may hide shown and once hidden.
// - open: why the html's text is not all known (an html enhancer writes some of it), else null.
// `pre` says the html is drawn where white space is kept (a Descriptions item).
function readHtmlPieces({ root, pre = false }) {
  const runs = [];
  let run = null;
  let open = null;
  const shown = [];
  const strict = [];
  function flush() {
    if (run !== null && run.text !== '') runs.push(run);
    run = null;
  }
  function add({ text, keep }) {
    if (run !== null && run.pre !== keep) flush();
    if (run === null) run = { text: '', pre: keep };
    run.text += text;
  }
  function visit(node, context) {
    if (node.nodeType === node.TEXT_NODE) {
      if (context.hidden) return;
      shown.push(node.nodeValue);
      if (!context.mayHide) strict.push(node.nodeValue);
      if (context.sure) {
        add({ text: node.nodeValue, keep: context.keep });
      } else {
        flush();
      }
      return;
    }
    if (node.nodeType !== node.ELEMENT_NODE || UNREAD_TAGS.has(node.tagName)) return;
    if (node.tagName === 'BR') {
      flush();
      return;
    }
    const element = node;
    const writes = element.matches(TEXT_WRITING);
    if (writes && open === null) {
      open =
        'an html enhancer writes some of its text (data-time, data-format, data-avatar, data-icon or data-copy)';
    }
    const hidden = context.hidden || isHiddenBelow({ element, stop: element.parentElement });
    const mayHide =
      context.mayHide ||
      hasHidingClass({ element, root: element.parentElement }) ||
      element.hasAttribute('data-popover-content');
    const next = {
      hidden: hidden || writes,
      mayHide,
      keep: context.keep || keepsSpace(element),
      sure:
        context.sure &&
        !mayHide &&
        !writes &&
        !transformsCase(element) &&
        !CONTROL_TAGS.has(element.tagName.toUpperCase()),
    };
    const breaks = breaksLine(element);
    if (breaks) flush();
    element.childNodes.forEach((child) => visit(child, next));
    if (breaks) flush();
  }
  root.childNodes.forEach((child) =>
    visit(child, { hidden: false, mayHide: false, keep: pre, sure: true })
  );
  flush();
  return {
    runs,
    units: [normalizeShownText(shown.join('')), normalizeShownText(strict.join(''))],
    open,
  };
}

// Whether a browser surely reads `contains` in a run. Where it keeps white space as written, the
// run holds it, starting and ending in no white space (a break beside the run may trim that).
// Where it collapses white space, `contains` must read the same collapsed (isPlainText) and the
// collapsed run hold it.
function runShows({ run, contains }) {
  if (run.pre) {
    return contains !== '' && contains === contains.trim() && run.text.includes(contains);
  }
  return isPlainText(contains) && run.text.replace(CSS_SPACE, ' ').includes(contains);
}

export { runShows };
export default readHtmlPieces;
