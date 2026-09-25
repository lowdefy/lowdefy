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

import { validate } from '@lowdefy/ajv';
import { getOperatorType, type } from '@lowdefy/helpers';

function escapePointerSegment(segment) {
  return segment.replace(/~/g, '~0').replace(/\//g, '~1');
}

function collectOperatorPaths(value, path, paths) {
  if (type.isArray(value)) {
    value.forEach((item, index) => collectOperatorPaths(item, `${path}/${index}`, paths));
    return;
  }
  if (!type.isObject(value)) {
    return;
  }
  if (getOperatorType(value) !== null) {
    paths.push(path);
    return;
  }
  Object.keys(value).forEach((key) => {
    if (key.startsWith('~')) return;
    collectOperatorPaths(value[key], `${path}/${escapePointerSegment(key)}`, paths);
  });
}

// Returns "properties/... message" strings for a block's schema violations.
// A violation at or under an operator node cannot be judged before the
// operator evaluates on the client — { _state: columns } may legitimately sit
// where the schema wants an array. Violations on operator-free paths stand.
function getPropertiesSchemaErrors({ block, blockSchemas }) {
  const properties = block.properties;
  if (!type.isObject(properties) || getOperatorType(properties) !== null) {
    return [];
  }
  // Block schemas validate the whole pre-build block shape; the plugin's
  // properties schema sits at schema.properties.properties.
  const propertiesSchema = blockSchemas[block.type]?.properties?.properties;
  if (type.isNone(propertiesSchema)) {
    return [];
  }
  const result = validate({ schema: propertiesSchema, data: properties, returnErrors: true });
  if (result.valid) {
    return [];
  }
  const operatorPaths = [];
  collectOperatorPaths(properties, '', operatorPaths);
  return result.errors
    .filter(
      (error) =>
        !operatorPaths.some(
          (path) => error.instancePath === path || error.instancePath.startsWith(`${path}/`)
        )
    )
    .map((error) => `properties${error.instancePath || ''} ${error.message}`);
}

export default getPropertiesSchemaErrors;
