/*
  Copyright 2020-2024 Lowdefy, Inc

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
import YAML, { isMap, isSeq, isPair, isScalar } from 'yaml';

function getLineNumber(content, offset) {
  if (offset == null || offset < 0) return null;
  return content.substring(0, offset).split('\n').length;
}

function addLineNumbersAndRefs(node, content, refCounter) {
  if (isMap(node)) {
    const obj = {};
    const refId = String(refCounter.next++);
    obj['~r'] = refId;
    if (node.range) {
      Object.defineProperty(obj, '~l', {
        value: getLineNumber(content, node.range[0]),
        enumerable: false,
        writable: true,
        configurable: true,
      });
    }
    for (const pair of node.items) {
      if (isPair(pair) && isScalar(pair.key)) {
        const key = pair.key.value;
        const value = pair.value;
        const keyLineNumber = pair.key.range ? getLineNumber(content, pair.key.range[0]) : null;
        if (isMap(value)) {
          const mapResult = addLineNumbersAndRefs(value, content, refCounter);
          if (keyLineNumber) {
            Object.defineProperty(mapResult, '~l', {
              value: keyLineNumber,
              enumerable: false,
              writable: true,
              configurable: true,
            });
          }
          obj[key] = mapResult;
        } else if (isSeq(value)) {
          // Don't add ~l to arrays - only objects need line numbers for error reporting
          obj[key] = addLineNumbersAndRefs(value, content, refCounter);
        } else if (isScalar(value)) {
          obj[key] = value.value;
        } else {
          obj[key] = value?.toJSON?.() ?? value;
        }
      }
    }
    return obj;
  }

  if (isSeq(node)) {
    const arr = [];
    // Note: We don't add ~l to arrays to keep serialized output simpler.
    // Line numbers on arrays aren't needed for error reporting - objects are the error sources.
    for (const item of node.items) {
      if (isMap(item)) {
        arr.push(addLineNumbersAndRefs(item, content, refCounter));
      } else if (isSeq(item)) {
        arr.push(addLineNumbersAndRefs(item, content, refCounter));
      } else if (isScalar(item)) {
        arr.push(item.value);
      } else {
        arr.push(item?.toJSON?.() ?? item);
      }
    }
    return arr;
  }

  if (isScalar(node)) {
    return node.value;
  }

  return node?.toJSON?.() ?? node;
}

/**
 * Parse YAML string for testing, adding ~l (line numbers) and ~r (ref IDs)
 * to simulate real buildRefs output.
 *
 * @param {string} yamlContent - YAML string to parse (use template literals for multiline)
 * @returns {object} Parsed object with ~l and ~r properties
 *
 * @example
 * const components = parseTestYaml(`
 * pages:
 *   - id: home
 *     type: Box
 *     blocks:
 *       - id: title
 *         type: Title
 * `);
 */
function parseTestYaml(yamlContent) {
  const doc = YAML.parseDocument(yamlContent);
  if (doc.errors && doc.errors.length > 0) {
    throw new Error(doc.errors[0].message);
  }
  const refCounter = { next: 1 };
  return addLineNumbersAndRefs(doc.contents, yamlContent, refCounter);
}

export default parseTestYaml;
