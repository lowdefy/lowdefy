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

import path from 'path';
import { get, type } from '@lowdefy/helpers';

function formatArrayItem({ index, object }) {
  if (!type.isObject(object)) {
    return `[${index}]`;
  }
  // Only use string ids to avoid showing numeric ids like "1" when id: 1 is invalid
  const rawId = object.id ?? object.blockId ?? object.menuId ?? object.requestId;
  const id = type.isString(rawId) ? rawId : null;
  const objType = object.type;
  if (id && objType) {
    return `[${index}:${id}:${objType}]`;
  }
  if (id) {
    return `[${index}:${id}]`;
  }
  if (objType) {
    return `[${index}:${objType}]`;
  }
  return `[${index}]`;
}

function buildRichPath({ components, instancePath }) {
  if (!instancePath || instancePath.length === 0) {
    return 'root';
  }

  let currentData = components;
  let richPath = 'root';

  for (let i = 0; i < instancePath.length; i++) {
    const key = instancePath[i];

    if (type.isArray(currentData)) {
      const index = parseInt(key, 10);
      const item = currentData[index];
      richPath += formatArrayItem({ index, object: item });
      currentData = item;
    } else {
      richPath += `.${key}`;
      currentData = get(currentData, key);
    }
  }

  return richPath;
}

function findLocationInfo({ components, instancePath, additionalProperty }) {
  // Navigate through the path to find location info
  // Check from deepest to shallowest
  const pathParts = [...instancePath];

  // For additional property errors, try to find the line of the offending property first
  if (additionalProperty) {
    let obj = components;
    for (const part of pathParts) {
      if (type.isNone(obj)) break;
      obj = get(obj, part);
    }
    // Check if the additional property itself has line info (works for both objects and arrays)
    const propValue = get(obj, additionalProperty);
    if ((type.isObject(propValue) || type.isArray(propValue)) && propValue['~l']) {
      return {
        ref: propValue['~r'],
        line: propValue['~l'],
      };
    }
  }

  while (pathParts.length >= 0) {
    let obj = components;
    for (const part of pathParts) {
      if (type.isNone(obj)) break;
      obj = get(obj, part);
    }

    // First look for ~r (referenced files)
    if (type.isObject(obj) && obj['~r']) {
      return {
        ref: obj['~r'],
        line: obj['~l'],
      };
    }

    // Fall back to ~l without ~r (root file content)
    if (type.isObject(obj) && obj['~l']) {
      return {
        ref: null,
        line: obj['~l'],
      };
    }

    if (pathParts.length === 0) break;
    pathParts.pop();
  }

  // Check root level
  if (type.isObject(components)) {
    if (components['~r']) {
      return {
        ref: components['~r'],
        line: components['~l'],
      };
    }
    if (components['~l']) {
      return {
        ref: null,
        line: components['~l'],
      };
    }
  }

  return null;
}

function formatErrorMessage({ error, components, context }) {
  const instancePath = error.instancePath.split('/').slice(1).filter(Boolean);
  const additionalProperty = error.params?.additionalProperty;

  let message = error.message;
  if (additionalProperty) {
    message = `${message} - "${additionalProperty}"`;
  }

  const richPath = buildRichPath({ components, instancePath });
  const locationInfo = findLocationInfo({ components, instancePath, additionalProperty });

  // Get file path and line number from location info or default to lowdefy.yaml
  let filePath = 'lowdefy.yaml';
  let lineNum = null;

  if (locationInfo) {
    lineNum = locationInfo.line;
    // If ref exists, look up the file path; otherwise use default lowdefy.yaml
    if (locationInfo.ref && context?.refMap) {
      const refInfo = context.refMap[locationInfo.ref];
      filePath = refInfo?.path ?? 'lowdefy.yaml';
    }
  }

  const source = lineNum ? `${filePath}:${lineNum}` : filePath;
  const fullPath = context?.directories?.config
    ? path.join(context.directories.config, filePath) + (lineNum ? `:${lineNum}` : '')
    : '';

  return `[Config Schema Error] ${message}
  ${source} at ${richPath}
  ${fullPath}`;
}

export default formatErrorMessage;
