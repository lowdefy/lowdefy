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

import React from 'react';
import { Text } from 'react-native';
import { type } from '@lowdefy/helpers';

import LinkChip from './LinkChip.js';

// Closing punctuation belongs to the word before it, so it never starts a line.
const PUNCTUATION = /^[.,;:)?!]+/;

function isText(node) {
  return React.isValidElement(node) && node.type === Text;
}

function isChip(node) {
  return React.isValidElement(node) && node.type === LinkChip;
}

function isEmpty(node) {
  return type.isNone(node) || type.isBoolean(node) || node === '';
}

function childList(node) {
  const { children } = node.props;
  return Array.isArray(children) ? children : [children];
}

function withChildren(node, list) {
  return React.cloneElement(node, {
    children: Array.isArray(node.props.children) ? list : list[0],
  });
}

function containsChip(node) {
  if (Array.isArray(node)) {
    return node.some(containsChip);
  }
  if (isChip(node)) {
    return true;
  }
  return isText(node) && containsChip(node.props.children);
}

// The punctuation a node's text starts with, the styles of the Texts it sits in (outermost
// first), and the node without it. Null when it does not start with punctuation.
function cutPunctuation(node, styles = []) {
  if (typeof node === 'string') {
    const match = PUNCTUATION.exec(node);
    if (match === null) {
      return null;
    }
    return { punctuation: match[0], rest: node.slice(match[0].length), styles };
  }
  if (!isText(node)) {
    return null;
  }
  const list = childList(node);
  const index = list.findIndex((child) => !isEmpty(child));
  if (index === -1) {
    return null;
  }
  const cut = cutPunctuation(list[index], [...styles, node.props.style]);
  if (cut === null) {
    return null;
  }
  const next = [...list];
  next[index] = cut.rest;
  return { ...cut, rest: withChildren(node, next) };
}

// The node with the punctuation drawn inside the chip it ends with, or null when it does not end
// with a chip.
function attachTrailing(node, trailing) {
  if (isChip(node)) {
    const before = node.props.trailing;
    return React.cloneElement(node, {
      trailing: before ? { ...before, text: `${before.text}${trailing.text}` } : trailing,
    });
  }
  if (!isText(node)) {
    return null;
  }
  const list = childList(node);
  let index = list.length - 1;
  while (index >= 0 && isEmpty(list[index])) {
    index -= 1;
  }
  if (index === -1) {
    return null;
  }
  const attached = attachTrailing(list[index], trailing);
  if (attached === null) {
    return null;
  }
  const next = [...list];
  next[index] = attached;
  return withChildren(node, next);
}

function gluePunctuation(list) {
  const nodes = list.map((node) =>
    isText(node) ? withChildren(node, gluePunctuation(childList(node))) : node
  );
  for (let index = 0; index < nodes.length - 1; index += 1) {
    if (isEmpty(nodes[index])) {
      continue;
    }
    let after = index + 1;
    while (after < nodes.length && isEmpty(nodes[after])) {
      after += 1;
    }
    const cut = after < nodes.length ? cutPunctuation(nodes[after]) : null;
    if (cut === null) {
      continue;
    }
    const attached = attachTrailing(nodes[index], { style: cut.styles, text: cut.punctuation });
    if (attached !== null) {
      nodes[index] = attached;
      nodes[after] = cut.rest;
    }
  }
  return nodes;
}

function markNode(node, followed) {
  if (typeof node === 'string' || typeof node === 'number') {
    return { content: String(node).trim() !== '', node };
  }
  if (isChip(node)) {
    return { content: true, node: React.cloneElement(node, { followed }) };
  }
  if (isText(node)) {
    const marked = markList(childList(node), followed);
    return { content: marked.content, node: withChildren(node, marked.nodes) };
  }
  return { content: React.isValidElement(node), node };
}

// Marks each chip with whether text follows it on its line, from the end back.
function markList(list, followed) {
  const nodes = [...list];
  let following = followed;
  let content = false;
  for (let index = nodes.length - 1; index >= 0; index -= 1) {
    const marked = markNode(nodes[index], following);
    nodes[index] = marked.node;
    if (marked.content) {
      following = true;
      content = true;
    }
  }
  return { content, nodes };
}

/**
 * A line of rendered markdown (a paragraph, a list item's text, a heading or a table cell) with
 * its link chips laid out as inline text: closing punctuation right after a chip (`.`, `,`, `;`,
 * `:`, `)`, `?`, `!`) moves into the chip's `trailing`, in the style of the text it came from, so
 * the chip and its punctuation wrap as one unit, and each chip is told whether text follows it
 * on the line (`followed`), which caps its width (getChipMaxWidth). Chips inside emphasis are
 * found too, and punctuation outside the emphasis still attaches.
 *
 * @param {React.ReactNode[]} nodes The line's parts, as the renderer drew them.
 * @returns {React.ReactNode[]}
 */
function layoutLinkChips(nodes) {
  if (!Array.isArray(nodes) || !containsChip(nodes)) {
    return nodes;
  }
  return markList(gluePunctuation(nodes), false).nodes;
}

export default layoutLinkChips;
