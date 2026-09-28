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

import TABLE_ONLY_KEYS from './tableOnlyKeys.js';

function unsupported({ path, feature }) {
  return new Error(`TableLight property "${path}" is not supported. Use Table for ${feature}.`);
}

function validateColumns({ columns, path }) {
  (columns ?? []).forEach((column, index) => {
    if (!type.isObject(column)) return;
    Object.keys(column).forEach((key) => {
      const feature = TABLE_ONLY_KEYS.columns[key];
      if (!type.isUndefined(feature)) {
        throw unsupported({ path: `${path}.${index}.${key}`, feature });
      }
    });
    if (type.isArray(column.children)) {
      validateColumns({ columns: column.children, path: `${path}.${index}.children` });
    }
  });
}

// TableLight's config is a strict subset of Table's, and a key from outside
// it is a mistake to report, not to ignore. Block properties are validated
// against the schema only when a block throws, so the block throws here: the
// error boundary reports it with the schema's message (meta.js) and the
// block's config location.
function validateTableLightProperties({ properties }) {
  Object.keys(properties).forEach((key) => {
    const feature = TABLE_ONLY_KEYS.properties[key];
    if (!type.isUndefined(feature)) throw unsupported({ path: key, feature });
  });
  if (!type.isNone(properties.data) && !type.isArray(properties.data)) {
    throw new Error(
      'TableLight property "data" must be an array of rows. Use Table for server mode (data.mode: server).'
    );
  }
  Object.keys(properties.defaultColumn ?? {}).forEach((key) => {
    const feature = TABLE_ONLY_KEYS.columns[key];
    if (!type.isUndefined(feature)) throw unsupported({ path: `defaultColumn.${key}`, feature });
  });
  if (type.isArray(properties.columns)) {
    validateColumns({ columns: properties.columns, path: 'columns' });
  }
}

export default validateTableLightProperties;
