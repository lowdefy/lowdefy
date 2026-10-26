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

import journeyTargetSelectors from './journeyTargetSelectors.js';
import parseElementsChain from './parseElementsChain.js';
import parseRowIndex from './parseRowIndex.js';
import type from './type.js';

const { blockWrapperPrefix, gridRules, interactiveRoles } = journeyTargetSelectors;

function blockIdOf(entry) {
  const id = entry.attributes.attr__id;
  if (!type.isString(id) || !id.startsWith(blockWrapperPrefix)) {
    return null;
  }
  return id.slice(blockWrapperPrefix.length);
}

function normaliseText(value) {
  if (!type.isString(value)) {
    return null;
  }
  const text = value.replace(/\s+/g, ' ').trim();
  return text === '' ? null : text;
}

function isOption(entry) {
  return (
    entry.classes.includes('ant-select-item-option') || entry.attributes.attr__role === 'option'
  );
}

// The chain form of the interactive-control selector. A radio or checkbox input inside a label
// is reached through the label, as the selector does.
function isInteractive(entry, position, scope) {
  const { attributes, tag } = entry;
  if (interactiveRoles.includes(attributes.attr__role)) {
    return true;
  }
  if (tag === 'input') {
    if (attributes.attr__type === 'hidden') {
      return false;
    }
    const isToggle = attributes.attr__type === 'radio' || attributes.attr__type === 'checkbox';
    return !(isToggle && scope.slice(position + 1).some((outer) => outer.tag === 'label'));
  }
  if (tag === 'a') {
    return type.isString(attributes.href) || type.isString(attributes.attr__href);
  }
  return ['button', 'textarea', 'select', 'label'].includes(tag);
}

// The text of the control the click reached (an interactive control or a dropdown option): its
// own text, else (a label or option whose text sits in a child) the first text between the
// clicked element and it. posthog-js records the clicked element's direct text and the text of
// buttons, links and other form elements. A click that reached no control has no text, as in
// describeElement: its block alone targets it.
function textOf(scope) {
  const controlIndex = scope.findIndex(
    (entry, position) => isInteractive(entry, position, scope) || isOption(entry)
  );
  if (controlIndex === -1) {
    return null;
  }
  for (const entry of [scope[controlIndex], ...scope.slice(0, controlIndex)]) {
    const text = normaliseText(entry.attributes.text);
    if (text !== null) {
      return text;
    }
  }
  return null;
}

// Whether a chain entry is a row or cell element of the grid the rule describes: its class, its
// attribute and, when the rule names one, its role (a Table header cell has a body cell's class
// and column key, but the role `columnheader`).
function matchesGridRule({ entry, kind, rule }) {
  if (!entry.classes.includes(rule[`${kind}Class`])) return false;
  if (!(`attr__${rule[`${kind}Attribute`]}` in entry.attributes)) return false;
  const role = rule[`${kind}Role`];
  return role === undefined || entry.attributes.attr__role === role;
}

// The row index or column key of the innermost row or cell element of any grid, as the class and
// attribute that grid renders them with. Null when the click was in no row or cell.
function findGridAttribute({ inner, kind }) {
  for (const entry of inner) {
    const rule = gridRules.find((candidate) => matchesGridRule({ entry, kind, rule: candidate }));
    if (rule) {
      return entry.attributes[`attr__${rule[`${kind}Attribute`]}`];
    }
  }
  return null;
}

// The journey target a posthog-js `$elements_chain` describes: the block wrappers the click
// passed through (innermost first), the grid row and column, the control's text, and whether it
// was a dropdown option. Pure, so the production pull runs it in Node on captured events. Total:
// any string gives a target and never throws.
function targetFromElementsChain(chain) {
  const entries = type.isString(chain) ? parseElementsChain(chain) : [];
  const blockIds = entries.map(blockIdOf).filter((blockId) => blockId !== null);
  const blockIndex = entries.findIndex((entry) => blockIdOf(entry) !== null);
  const inner = blockIndex === -1 ? entries : entries.slice(0, blockIndex);
  const scope = blockIndex === -1 ? entries : entries.slice(0, blockIndex + 1);
  const row = findGridAttribute({ inner, kind: 'row' });
  const column = findGridAttribute({ inner, kind: 'cell' });
  return {
    block_id: blockIds[0] ?? null,
    row: row === null ? null : parseRowIndex(row),
    column,
    text: textOf(scope),
    option: inner.some(isOption),
    block_ids: blockIds,
  };
}

export default targetFromElementsChain;
