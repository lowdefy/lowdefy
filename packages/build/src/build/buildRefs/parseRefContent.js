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

/* eslint-disable no-param-reassign */

import { type } from '@lowdefy/helpers';
import { getFileExtension, getFileSubExtension } from '@lowdefy/node-utils';
import JSON5 from 'json5';
import YAML, { isMap, isSeq, isPair, isScalar } from 'yaml';

import parseNunjucks from './parseNunjucks.js';
import setNonEnumerableProperty from '../../utils/setNonEnumerableProperty.js';

function getLineNumber(content, offset) {
  if (offset == null || offset < 0) return null;
  return content.substring(0, offset).split('\n').length;
}

function addLineNumbers(node, content, result) {
  if (isMap(node)) {
    const obj = result || {};
    if (node.range) {
      setNonEnumerableProperty(obj, '~l', getLineNumber(content, node.range[0]));
    }
    for (const pair of node.items) {
      if (isPair(pair) && isScalar(pair.key)) {
        const key = pair.key.value;
        const value = pair.value;
        // Use key's line number for the value's ~l (more useful for error messages)
        const keyLineNumber = pair.key.range ? getLineNumber(content, pair.key.range[0]) : null;
        if (isMap(value)) {
          const mapResult = addLineNumbers(value, content, {});
          // Override ~l with key's line number if available
          if (keyLineNumber) {
            setNonEnumerableProperty(mapResult, '~l', keyLineNumber);
          }
          obj[key] = mapResult;
        } else if (isSeq(value)) {
          const arrResult = addLineNumbers(value, content, []);
          // Override ~l with key's line number if available
          if (keyLineNumber) {
            setNonEnumerableProperty(arrResult, '~l', keyLineNumber);
          }
          obj[key] = arrResult;
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
    const arr = result || [];
    if (node.range) {
      setNonEnumerableProperty(arr, '~l', getLineNumber(content, node.range[0]));
    }
    for (const item of node.items) {
      if (isMap(item)) {
        arr.push(addLineNumbers(item, content, {}));
      } else if (isSeq(item)) {
        arr.push(addLineNumbers(item, content, []));
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

function parseYamlWithLineNumbers(content) {
  const doc = YAML.parseDocument(content);
  if (doc.errors && doc.errors.length > 0) {
    throw new Error(doc.errors[0].message);
  }
  return addLineNumbers(doc.contents, content);
}

function parseRefContent({ content, refDef }) {
  const { path, vars } = refDef;
  if (type.isString(path)) {
    let ext = getFileExtension(path);
    if (ext === 'njk') {
      content = parseNunjucks(content, vars);
      ext = getFileSubExtension(path);
    }

    if (ext === 'yaml' || ext === 'yml') {
      content = parseYamlWithLineNumbers(content);
    }
    if (ext === 'json') {
      content = JSON5.parse(content);
    }
  }

  return content;
}

export default parseRefContent;
