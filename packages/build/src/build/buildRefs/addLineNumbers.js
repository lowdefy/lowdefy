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

/* eslint-disable no-param-reassign */

import { isMap, isSeq, isPair, isScalar } from 'yaml';
import {
  compileExpression,
  isExpression,
  stampPosition,
  unescapeExpression,
} from '@lowdefy/operators';

import getColumnNumber from './getColumnNumber.js';
import getLineNumber from './getLineNumber.js';
import setNonEnumerableProperty from '../../utils/setNonEnumerableProperty.js';

// Keys whose value subtree is a raw string owned by another language and must
// never be scanned for ${ … } (§6.6): a _js body is JavaScript (its ${…} are
// template literals) and a _nunjucks template uses {{ }} but may contain
// literal ${ text.
const RAW_OPERATOR_KEYS = new Set(['_js', '_nunjucks']);

// Resolves a scalar to a JS value, compiling a ${ … } expression to an operator
// tree with source positions stamped, unless it sits inside a raw-operator
// subtree. Compilation happens here — the single point holding the YAML scalar
// node (line and column) together with the raw file content — so every later
// build check sees ordinary operators (§6).
function resolveScalar({ scalar, content, filePath, insideRawOperator }) {
  const value = scalar.value;
  if (insideRawOperator) {
    return value;
  }
  // The literal escape (§7): "$${ … }" is not an expression — it yields the
  // literal "${ … }" string. Inside a raw-operator subtree the scalar is
  // untouched entirely (the other language owns its $ syntax), so the escape
  // only applies at positions that would otherwise trigger compilation.
  if (!isExpression(value)) {
    return unescapeExpression(value);
  }
  const offset = scalar.range ? scalar.range[0] : null;
  const line = getLineNumber(content, offset);
  const column = getColumnNumber(content, offset);
  const tree = compileExpression({
    expression: value,
    filePath,
    lineNumber: line,
    columnNumber: column,
  });
  // A ${ … } that folds to a bare literal (e.g. ${ 5 }) has no node to stamp.
  if (typeof tree !== 'object' || tree === null) {
    return tree;
  }
  return stampPosition({ tree, line, column, expression: value.trim() });
}

function addLineNumbers(node, content, result, { filePath, insideRawOperator = false } = {}) {
  if (isMap(node)) {
    const obj = result || {};
    if (node.range) {
      setNonEnumerableProperty(obj, '~l', getLineNumber(content, node.range[0]));
    }
    for (const pair of node.items) {
      if (isPair(pair) && isScalar(pair.key)) {
        const key = pair.key.value;
        const value = pair.value;
        const childRaw = insideRawOperator || RAW_OPERATOR_KEYS.has(key);
        // Use key's line number for the value's ~l (more useful for error messages)
        const keyLineNumber = pair.key.range ? getLineNumber(content, pair.key.range[0]) : null;
        if (isMap(value)) {
          const mapResult = addLineNumbers(
            value,
            content,
            {},
            {
              filePath,
              insideRawOperator: childRaw,
            }
          );
          // Override ~l with key's line number if available
          if (keyLineNumber) {
            setNonEnumerableProperty(mapResult, '~l', keyLineNumber);
          }
          obj[key] = mapResult;
        } else if (isSeq(value)) {
          const arrResult = addLineNumbers(value, content, [], {
            filePath,
            insideRawOperator: childRaw,
          });
          // Override ~l with key's line number if available
          if (keyLineNumber) {
            setNonEnumerableProperty(arrResult, '~l', keyLineNumber);
          }
          obj[key] = arrResult;
        } else if (isScalar(value)) {
          obj[key] = resolveScalar({
            scalar: value,
            content,
            filePath,
            insideRawOperator: childRaw,
          });
        } else {
          obj[key] = value?.toJSON?.() ?? value;
        }
      }
    }
    return obj;
  }

  if (isSeq(node)) {
    const arr = result || [];
    if (node.range) {
      setNonEnumerableProperty(arr, '~l', getLineNumber(content, node.range[0]));
    }
    for (const item of node.items) {
      if (isMap(item)) {
        arr.push(addLineNumbers(item, content, {}, { filePath, insideRawOperator }));
      } else if (isSeq(item)) {
        arr.push(addLineNumbers(item, content, [], { filePath, insideRawOperator }));
      } else if (isScalar(item)) {
        arr.push(resolveScalar({ scalar: item, content, filePath, insideRawOperator }));
      } else {
        arr.push(item?.toJSON?.() ?? item);
      }
    }
    return arr;
  }

  if (isScalar(node)) {
    return resolveScalar({ scalar: node, content, filePath, insideRawOperator });
  }

  return node?.toJSON?.() ?? node;
}

export default addLineNumbers;
