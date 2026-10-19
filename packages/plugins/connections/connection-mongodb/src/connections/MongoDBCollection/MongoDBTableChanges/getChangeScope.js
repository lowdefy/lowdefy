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

import { ConfigError } from '@lowdefy/errors';
import { get, set } from '@lowdefy/helpers';

import getFilterScope from './getFilterScope.js';
import getInsertDefaultPaths from './getInsertDefaultPaths.js';
import isSameValue from './isSameValue.js';
import pathsOverlap from './pathsOverlap.js';

function assertNotScopePath({ name, path, scope }) {
  const scopePath = scope.paths.find((other) => pathsOverlap(path, other));
  if (scopePath !== undefined) {
    throw new ConfigError(
      `MongoDBTableChanges ${name} writes "${path}", which "filter" scopes the rows by, so a change could move a row out of scope. Keep scope fields out of "fields".`
    );
  }
}

function assertNotDefaultPath({ name, path, defaultPaths }) {
  if (defaultPaths.some((other) => pathsOverlap(path, other))) {
    throw new ConfigError(
      `MongoDBTableChanges ${name} writes "${path}", which "insertDefaults" sets on new rows, so a row could replace it. Leave the field out of "fields", or give its column a default in TableInput instead.`
    );
  }
}

// New rows are stamped with the filter's equalities, so a default may repeat one but not
// set it (or a path inside or over it) to anything else.
function getScopeValues({ scope, insertDefaults, defaultPaths }) {
  const defaults = {};
  Object.entries(insertDefaults).forEach(([path, value]) => {
    set(defaults, path, value);
  });
  scope.equalities.forEach(({ path, value }) => {
    const defaultPath = defaultPaths.find((other) => pathsOverlap(path, other));
    if (defaultPath === undefined) return;
    const defaultValue = get(defaults, defaultPath, { default: undefined });
    if (defaultPath !== path || !isSameValue(defaultValue, value)) {
      throw new ConfigError(
        `MongoDBTableChanges "insertDefaults" sets "${defaultPath}" to ${JSON.stringify(
          defaultValue
        )}, but "filter" matches "${path}" to ${JSON.stringify(
          value
        )}, so new rows would be out of scope.`
      );
    }
  });
  return scope.equalities.map(({ path, value }) => [path, value]);
}

// A new row is only in scope when it matches the filter. Equalities are stamped on it; any
// other condition must be set by insertDefaults (the app vouches for that value), and an
// operator such as $expr can not be stamped at all.
function assertInsertsInScope({ scope, defaultPaths, equalityPaths }) {
  if (scope.operators.length > 0) {
    throw new ConfigError(
      `MongoDBTableChanges can not add rows: "filter" has "${scope.operators[0]}", which new rows can not be stamped with. Scope the rows with equality conditions such as { org_id: <value> }.`
    );
  }
  const uncovered = scope.conditions.find(
    (path) => ![...defaultPaths, ...equalityPaths].some((other) => pathsOverlap(path, other))
  );
  if (uncovered !== undefined) {
    throw new ConfigError(
      `MongoDBTableChanges can not add rows: "filter" matches "${uncovered}" by a condition that is not an equality, so new rows need "${uncovered}" set by "insertDefaults".`
    );
  }
}

// The base filter and insertDefaults are the app's scope: the organization or owner of the
// rows. No field (and no position) may write a path of either, so no change can move a row out
// of scope or give a new row another scope. In collection mode new rows are stamped with the
// filter's equalities (`scopeValues`); in array mode the filter scopes the document, whose
// paths the item fields are compared at (`arrayPath`), and pushed items are not documents.
function getChangeScope({
  fieldsByKey,
  filter,
  insertDefaults,
  positionField,
  arrayPath,
  hasInserts,
}) {
  const scope = getFilterScope({ filter });
  const defaultPaths = getInsertDefaultPaths({ insertDefaults });
  const documentPath = (path) => (arrayPath === undefined ? path : `${arrayPath}.${path}`);
  fieldsByKey.forEach((field) => {
    assertNotScopePath({ name: `field "${field.key}"`, path: documentPath(field.path), scope });
    assertNotDefaultPath({ name: `field "${field.key}"`, path: field.path, defaultPaths });
  });
  if (positionField !== undefined) {
    assertNotScopePath({ name: '"positionField"', path: documentPath(positionField), scope });
    assertNotDefaultPath({ name: '"positionField"', path: positionField, defaultPaths });
  }
  if (arrayPath !== undefined) return { scopeValues: [] };
  const scopeValues = getScopeValues({ scope, insertDefaults, defaultPaths });
  if (hasInserts) {
    assertInsertsInScope({
      scope,
      defaultPaths,
      equalityPaths: scopeValues.map(([path]) => path),
    });
  }
  return { scopeValues };
}

export default getChangeScope;
