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

import { humaniseSegment, isIndex, pathToString, singularise } from './pathUtils.js';

const SEPARATOR = ' \u203A ';

function labelForNonIndex(segment, subPath, labelsMap) {
  const subPathStr = pathToString(subPath);
  if (type.isObject(labelsMap) && type.isString(labelsMap[subPathStr])) {
    return labelsMap[subPathStr];
  }
  return humaniseSegment(segment);
}

function breadcrumbLabel(path, labelsMap) {
  if (!type.isArray(path) || path.length === 0) return '';

  const parts = [];

  path.forEach((segment, index) => {
    if (isIndex(segment)) {
      const ordinal = Number(segment) + 1;
      if (parts.length === 0) {
        parts.push(String(ordinal));
        return;
      }
      const parent = parts[parts.length - 1];
      parts[parts.length - 1] = `${singularise(parent)} ${ordinal}`;
      return;
    }
    const cumulativePath = path.slice(0, index + 1);
    parts.push(labelForNonIndex(segment, cumulativePath, labelsMap));
  });

  return parts.join(SEPARATOR);
}

export default breadcrumbLabel;
