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

import { TEXT_WRITING } from '../standIns/matchHtmlText.js';
import isPlainText from './isPlainText.js';
import readClassToken, { mayApplyClass } from './readClassToken.js';
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
// Elements whose children a browser draws only as fallback content, which it does not render.
const FALLBACK_TAGS = new Set(['AUDIO', 'CANVAS', 'VIDEO']);
// Utilities that lay an element out as a block, a flex or grid box, or out of flow (Tailwind's,
// sr-only and line-clamp among them, and an arbitrary display, position or float). A class counts
// when it may apply at the browser runner's width (readClassToken).
const LAYOUT_CLASS =
  /^(block|inline-block|flex|inline-flex|grid|inline-grid|table|table-.+|flow-root|list-item|contents|float-.+|absolute|fixed|sticky|sr-only|line-clamp-.+|\[(display|position|float):.+\])$/;
const FLEX_CLASS = /^(flex|inline-flex|grid|inline-grid)$/;
// The attributes block-utils' html css lays out as an inline flex box (createHtmlCss).
const FLEX_ATTRIBUTES = ['data-avatar', 'data-lf-copy', 'data-status', 'data-tag'];
// The data-truncate values block-utils' html css clamps (createHtmlCss): a -webkit-box, laid out
// as a block, with its white space collapsed.
const TRUNCATE_VALUES = new Set(['', '1', '2', '3', '4', '5', '6']);
const TRANSFORM_CLASS = /^(uppercase|lowercase|capitalize|\[text-transform:.+\])$/;
const WHITE_SPACE_CLASS = /^(whitespace-.+|\[white-space:.+\])$/;
const HIDING_CLASS = /^(hidden|invisible|collapse|\[(display|visibility):.+\])$/;
// White space as CSS collapses it; a no-break space is not.
const CSS_SPACE = /[ \t\n\r\f]+/g;

function hasClass({ element, pattern }) {
  return mayApplyClass({ tokens: [...(element.classList ?? [])], pattern });
}

function isFlexBox(element) {
  return (
    /flex|grid/.test(element.style?.display ?? '') ||
    hasClass({ element, pattern: FLEX_CLASS }) ||
    FLEX_ATTRIBUTES.some((name) => element.hasAttribute(name))
  );
}

function isTruncated(element) {
  return TRUNCATE_VALUES.has(element.getAttribute('data-truncate'));
}

// Whether innerText may put a break between this element's text and the text around it: any
// element but an inline one, an inline one laid out otherwise by its style, class or a clamping
// data-truncate, and any child of a flex or grid box, which lays its children out as blocks
// (flexParent).
function breaksLine({ element, flexParent }) {
  if (!INLINE_TAGS.has(element.tagName)) return true;
  const { style } = element;
  if (style?.display || style?.float || style?.position) return true;
  if (hasClass({ element, pattern: LAYOUT_CLASS }) || isTruncated(element)) return true;
  return flexParent;
}

function readSpaceValue(value) {
  if (/^(pre|pre-wrap|break-spaces)$/.test(value)) return 'keep';
  if (/^(normal|nowrap)$/.test(value)) return 'collapse';
  return 'unsure';
}

// How an element sets white space: 'keep' (as written: pre, pre-wrap, break-spaces), 'collapse'
// (normal, nowrap), 'unsure' (pre-line, which keeps breaks but collapses spaces, a value this does
// not know, a class that may or may not apply, or two that compete), or null when it sets none and
// inherits it. An inline style and a class that competes with it (an important one wins) is
// unsure.
function readWhiteSpace(element) {
  const styled = element.style?.whiteSpace ?? '';
  const classes = [...(element.classList ?? [])]
    .map((token) => readClassToken(token))
    .filter(({ utility, applies }) => applies !== false && WHITE_SPACE_CLASS.test(utility));
  if (classes.length > 1 || (styled !== '' && classes.length > 0)) return 'unsure';
  if (styled !== '') return readSpaceValue(styled);
  if (classes.length === 1) {
    const [{ utility, applies }] = classes;
    if (applies === null) return 'unsure';
    return readSpaceValue(utility.match(/^whitespace-(.+)$/)?.[1] ?? '');
  }
  if (isTruncated(element)) return 'collapse';
  if (element.tagName === 'PRE') return 'keep';
  return null;
}

function transformsCase(element) {
  return (
    !['', 'none'].includes(element.style?.textTransform ?? '') ||
    hasClass({ element, pattern: TRANSFORM_CLASS })
  );
}

// The text an html string shows, as far as the html says without laying it out (root is the
// parsed html, loadHtmlDom's parse). Returns { runs, classHidden, units, open }:
// - runs: the stretches of text a browser draws with no break inside them, each { text, pre }:
//   the text nodes between two elements that may break a line, joined. A run leaves out text
//   that may not show or may show changed: hidden by the html or by a class the page's CSS may
//   hide by, inside an element whose text an html enhancer writes, or under a case transform.
//   pre says the run keeps its white space as written (a <pre>, or a white-space style or class);
//   otherwise a browser collapses it. Text whose white space handling is not sure (pre-line, a
//   white-space class that may or may not apply) is left out.
// - classHidden: the runs inside an element a class may hide, which a browser may or may not
//   draw (a responsive class such as max-[899px]:hidden), for a reason that names them.
// - units: the html's text as a browser's innerText may read it, with white space and case taken
//   out (normalizeShownText): once with the elements a class may hide shown and once hidden.
// - open: why the html's text is not all known (an html enhancer writes some of it, or a style
//   element's CSS may hide or change it), else null.
// `pre` says the html is drawn where white space is kept (a Descriptions item), and `flexRoot`
// that the element it is drawn in may be a flex or grid box, which lays its top-level children
// out as blocks.
// Collects runs: text added while it reads as written joins the current run, and a break, a
// change in white space handling or text that may not read as written ends it.
function createRuns() {
  const runs = [];
  let run = null;
  return {
    runs,
    flush() {
      if (run !== null && run.text !== '') runs.push(run);
      run = null;
    },
    add({ text, keep }) {
      if (run !== null && run.pre !== keep) this.flush();
      if (run === null) run = { text: '', pre: keep };
      run.text += text;
    },
  };
}

function readHtmlPieces({ root, pre = false, flexRoot = false }) {
  const sure = createRuns();
  const classHidden = createRuns();
  let open = null;
  if (root.querySelector('style') !== null) {
    open = 'it holds a style element, whose CSS may hide or change its text';
  }
  const shown = [];
  const strict = [];
  function flush() {
    sure.flush();
    classHidden.flush();
  }
  function visit(node, context) {
    if (node.nodeType === node.TEXT_NODE) {
      if (context.hidden) return;
      shown.push(node.nodeValue);
      if (!context.mayHide) strict.push(node.nodeValue);
      [
        [sure, context.sure && !context.mayHide],
        [classHidden, context.sure && context.mayHide],
      ].forEach(([runs, reads]) => {
        if (reads) {
          runs.add({ text: node.nodeValue, keep: context.keep });
        } else {
          runs.flush();
        }
      });
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
    // As isHiddenBelow reads the html, except visibility: hidden (or collapse), which hides the
    // element's text but not a child's that sets it visible again, so it may hide.
    const invisible = ['hidden', 'collapse'].includes(element.style?.visibility);
    const parent = element.parentElement;
    const closedDetails =
      parent !== null &&
      parent.tagName === 'DETAILS' &&
      !parent.hasAttribute('open') &&
      element.tagName !== 'SUMMARY';
    const closedDialog = element.tagName === 'DIALOG' && !element.hasAttribute('open');
    const hidden =
      context.hidden ||
      element.hidden ||
      element.style?.display === 'none' ||
      closedDetails ||
      closedDialog;
    const mayHide =
      context.mayHide ||
      invisible ||
      hasClass({ element, pattern: HIDING_CLASS }) ||
      element.hasAttribute('data-popover-content');
    const whiteSpace = readWhiteSpace(element);
    let { keep } = context;
    if (whiteSpace === 'keep') keep = true;
    if (whiteSpace === 'collapse') keep = false;
    const next = {
      hidden: hidden || writes || FALLBACK_TAGS.has(element.tagName),
      mayHide,
      keep,
      sure:
        context.sure &&
        !writes &&
        whiteSpace !== 'unsure' &&
        !transformsCase(element) &&
        !CONTROL_TAGS.has(element.tagName.toUpperCase()),
    };
    const breaks = breaksLine({
      element,
      flexParent: parent !== null && (isFlexBox(parent) || (flexRoot && parent === root)),
    });
    // The text an enhancer writes stands between the text before it and the text after it.
    if (breaks || writes) flush();
    element.childNodes.forEach((child) => visit(child, next));
    if (breaks) flush();
  }
  root.childNodes.forEach((child) =>
    visit(child, { hidden: false, mayHide: false, keep: pre, sure: true })
  );
  flush();
  return {
    runs: sure.runs,
    classHidden: classHidden.runs,
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
