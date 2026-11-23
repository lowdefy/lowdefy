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

import NATIVE_INTERACTIVE from '@lowdefy/block-utils/htmlEnhancers/nativeInteractive.js';
import { isInteractiveControl, type } from '@lowdefy/helpers';

import readNodeText from '../readNodeText.js';
import isHiddenBelow from './isHiddenBelow.js';

// The elements of a ClickableHtml's html a `text` or `containing` target matches, as the browser
// runner matches them on the page (runJourneySteps' locateMatches): `text` the visible interactive
// controls whose whole text is the text, Playwright's exact match (exactText); `containing` the
// innermost elements whose shown text holds the string, whitespace collapsed and case ignored
// (registerShownTextEngine), visible.
//
// A headless page lays nothing out, so two things a browser reads are read from the html alone:
// - A browser reads a `containing` target's text as laid out (innerText), with a break between
//   block-level boxes, which the page's CSS decides. The html is read twice, with nothing between
//   elements and with a space between every two, which bound any layout. When the two disagree on
//   what matches, the answer depends on the layout.
// - Some enhancers write the text an element shows (a formatted time or number, an avatar's
//   initials, an icon, a copy button). The html is read with and without those elements' text;
//   when the two disagree, the answer depends on text the enhancer writes.
// - The page's CSS may hide an element by a class (`hidden`, `md:hidden`, `invisible`). The html is
//   read with such elements shown and hidden; when the two disagree, the answer depends on CSS.
// Either way the reply says so in `uncertain`, and the step runs in a browser.

// Elements whose shown text an html enhancer writes or adds to.
const TEXT_WRITING = '[data-avatar], [data-copy], [data-format], [data-icon], [data-time]';
// Elements the shown-text engine never reads.
const UNREAD_ELEMENTS = new Set(['HEAD', 'NOSCRIPT', 'SCRIPT', 'STYLE', 'TEMPLATE']);
const BUTTON_INPUTS = 'input[type=button], input[type=submit]';

// The html as the browser's enhancers leave it for a target to match: popoverEnhancer gives a
// popover trigger that is no native control the button role, and linkEnhancer gives a page link
// its href. Both run whenever the html holds their attribute (HtmlComponent's enhancer gate).
function enhance(root) {
  root.querySelectorAll('[data-popover]').forEach((element) => {
    if (!element.matches(NATIVE_INTERACTIVE) && !element.hasAttribute('role')) {
      element.setAttribute('role', 'button');
    }
  });
  root.querySelectorAll('a[data-page-id]:not([href])').forEach((element) => {
    element.setAttribute('href', '#');
  });
}

// A class that hides an element in common CSS (Tailwind's hidden and invisible, with or without
// a breakpoint).
const HIDING_CLASS = /(^|:)(hidden|invisible)$/;

function hasHidingClass({ element, root }) {
  for (
    let current = element;
    current !== null && current !== root;
    current = current.parentElement
  ) {
    if ([...(current.classList ?? [])].some((token) => HIDING_CLASS.test(token))) return true;
  }
  return false;
}

// Whether a browser draws the element: the html hides nothing between it and the root, and it
// waits in no popover's content, which ClickableHtml's CSS hides until the popover opens. With
// `hideClassed`, an element a hiding class marks counts as hidden too.
function isShown({ element, root, hideClassed = false }) {
  return (
    !isHiddenBelow({ element, stop: root }) &&
    !(hideClassed && hasHidingClass({ element, root })) &&
    (element.closest('[data-popover-content]') === null ||
      !root.contains(element.closest('[data-popover-content]')))
  );
}

function skipTextWriting(element) {
  return element.matches(TEXT_WRITING);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Playwright's exact match on a control's text, as the browser runner's exactText writes it.
function exactTextPattern(text) {
  return new RegExp(`^\\s*${escapeRegExp(text)}\\s*$`);
}

function matchExactText({ root, text, skip, hideClassed }) {
  const exact = exactTextPattern(text);
  return [...root.querySelectorAll('*')].filter(
    (element) =>
      isInteractiveControl(element) &&
      isShown({ element, root, hideClassed }) &&
      exact.test(readNodeText(element, skip))
  );
}

function normalize(text) {
  return text.replace(/[\u200b\u00ad]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
}

// An element's text as a browser's innerText reads it, as far as the html says: a hidden element
// reads as its textContent (innerText of an element that is not drawn), a drawn one as the text of
// its drawn descendants, with nothing or a space (`spaced`) between elements.
function readInnerText({ element, root, skip, spaced, hideClassed }) {
  if (!isShown({ element, root, hideClassed })) {
    return element.textContent ?? '';
  }
  function read(node) {
    if (node.nodeType === node.TEXT_NODE) {
      return node.nodeValue;
    }
    if (
      node.nodeType !== node.ELEMENT_NODE ||
      UNREAD_ELEMENTS.has(node.tagName) ||
      skip(node) ||
      !isShown({ element: node, root, hideClassed })
    ) {
      return '';
    }
    if (node.tagName === 'BR') {
      return '\n';
    }
    const text = [...node.childNodes].map(read).join(spaced ? ' ' : '');
    return spaced ? ` ${text} ` : text;
  }
  return read(element);
}

function matchContaining({ root, containing, skip, spaced, hideClassed }) {
  const needle = normalize(containing);
  const matches = [];
  function visit(element) {
    if (UNREAD_ELEMENTS.has(element.tagName) || skip(element)) {
      return false;
    }
    let childMatches = false;
    for (const child of element.children) {
      if (visit(child)) {
        childMatches = true;
      }
    }
    if (childMatches) {
      return true;
    }
    if (!normalize(readInnerText({ element, root, skip, spaced, hideClassed })).includes(needle)) {
      return false;
    }
    matches.push(element);
    return true;
  }
  visit(root);
  root.querySelectorAll(BUTTON_INPUTS).forEach((input) => {
    if (normalize(input.value).includes(needle)) {
      matches.push(input);
    }
  });
  return matches.filter((element) => isShown({ element, root, hideClassed }));
}

function sameElements(first, second) {
  return first.length === second.length && first.every((element, i) => element === second[i]);
}

// { elements, uncertain }: the matches in html order, and why the html alone cannot tell them
// (null when it can). root is the parsed html (loadHtmlDom's parse), which this changes as the
// enhancers do; target holds text or containing.
function matchHtmlText({ root, target }) {
  enhance(root);
  const readAll = () => false;
  const match = (options) =>
    type.isUndefined(target.containing)
      ? matchExactText({ root, text: String(target.text), ...options })
      : matchContaining({ root, containing: String(target.containing), ...options });
  const elements = match({ skip: readAll, spaced: false });
  if (elements.includes(root)) {
    return {
      elements,
      uncertain: `"${target.containing}" runs across the html's top-level elements, so a browser matches the block itself`,
    };
  }
  if (
    !type.isUndefined(target.containing) &&
    !sameElements(elements, match({ skip: readAll, spaced: true }))
  ) {
    return {
      elements,
      uncertain: `what matches "${target.containing}" depends on how the page lays out its text`,
    };
  }
  if (
    root.querySelector(TEXT_WRITING) !== null &&
    !sameElements(elements, match({ skip: skipTextWriting, spaced: false }))
  ) {
    return {
      elements,
      uncertain:
        'what matches depends on text an html enhancer writes (data-time, data-format, data-avatar, data-icon or data-copy)',
    };
  }
  if (!sameElements(elements, match({ skip: readAll, spaced: false, hideClassed: true }))) {
    return {
      elements,
      uncertain: "what matches depends on a class (hidden, invisible) the page's CSS may hide",
    };
  }
  return { elements, uncertain: null };
}

export { exactTextPattern, hasHidingClass, normalize, TEXT_WRITING };
export default matchHtmlText;
