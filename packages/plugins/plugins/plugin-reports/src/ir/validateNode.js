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

import { type } from '@lowdefy/helpers';
import { ConfigError } from '@lowdefy/errors';

import invalidNode from './invalidNode.js';
import validateFraction from './validateFraction.js';
import validateRow from './validateRow.js';
import validateTable from './validateTable.js';

const KIND_SET = new Set([
  'heading',
  'text',
  'markdown',
  'svg',
  'image',
  'grid',
  'table',
  'stat',
  'row',
  'stack',
  'divider',
  'spacer',
]);

const HEADING_LEVELS = new Set([1, 2, 3, 4]);

function requireString(node, key) {
  if (!type.isString(node[key])) {
    throw invalidNode(node.kind, `'${key}' must be a string.`);
  }
}

function requirePositiveNumber(node, key) {
  if (!type.isNumber(node[key]) || node[key] <= 0) {
    throw invalidNode(node.kind, `'${key}' must be a positive number of points.`);
  }
}

function requireOptionalPositiveNumber(node, key) {
  if (node[key] === undefined) return;
  requirePositiveNumber(node, key);
}

function validateChildren(node) {
  if (!type.isArray(node.children)) {
    throw invalidNode(node.kind, "'children' must be an array of nodes.");
  }
  node.children.forEach((child) => validateNode(child));
}

/**
 * Validate an IR node (recursively). Throws a ConfigError naming the offending
 * kind and rule; returns the node so callers can validate-and-pass in one step.
 * Every rule here is one the translators rely on: anything that passes can be
 * rendered by both pdfmake and ExcelJS without a crash.
 */
function validateNode(node) {
  if (!type.isObject(node) || !type.isString(node.kind)) {
    throw new ConfigError('Invalid report IR node: expected an object with a string kind.');
  }
  const { kind } = node;
  if (!KIND_SET.has(kind)) {
    throw new ConfigError(`Unknown report IR node kind '${kind}'.`);
  }
  switch (kind) {
    case 'heading':
      requireString(node, 'text');
      if (!HEADING_LEVELS.has(node.level)) {
        throw invalidNode(kind, "'level' must be an integer from 1 to 4.");
      }
      break;
    case 'text':
      requireString(node, 'text');
      if (node.tint !== undefined) requireString(node, 'tint');
      break;
    case 'markdown':
      requireString(node, 'markdown');
      break;
    case 'svg':
      requireString(node, 'svg');
      if (node.svg === '') throw invalidNode(kind, "'svg' must not be empty.");
      requirePositiveNumber(node, 'width');
      requirePositiveNumber(node, 'height');
      break;
    case 'image':
      requireString(node, 'src');
      if (node.src === '') throw invalidNode(kind, "'src' must not be empty.");
      requireOptionalPositiveNumber(node, 'width');
      requireOptionalPositiveNumber(node, 'height');
      break;
    case 'grid':
    case 'table':
      validateTable(node);
      break;
    case 'stat':
      requireString(node, 'label');
      requireString(node, 'value');
      break;
    case 'row':
      validateRow(node);
      validateChildren(node);
      break;
    case 'stack':
      validateChildren(node);
      break;
    case 'spacer':
      if (!validateFraction(node.width)) {
        throw invalidNode(kind, "'width' must be a fraction in (0, 1].");
      }
      break;
    default:
      // divider carries no properties.
      break;
  }
  return node;
}

export default validateNode;
