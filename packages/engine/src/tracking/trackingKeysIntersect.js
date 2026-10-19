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

function splitKey(key) {
  const separator = key.indexOf(':');
  if (separator === -1) {
    return { namespace: key, path: null };
  }
  return { namespace: key.slice(0, separator), path: key.slice(separator + 1) };
}

// A bare namespace ('i18n'), an empty path and the '*' wildcard all cover the whole namespace.
function isWholeNamespace(path) {
  return path === null || path === '' || path === '*';
}

// True when path lies strictly below prefix, split at a '.' boundary: 'a.b' is below 'a', but 'ab'
// is not.
function isBelow({ path, prefix }) {
  return path.length > prefix.length && path.startsWith(prefix) && path[prefix.length] === '.';
}

// Both keys are normalised (see normalizeTrackingKey). A read is affected by a change to the same
// path, to a parent path (setting 'a' replaces 'a.b'), or to a child path (setting 'a.b' changes
// what a read of 'a' returns).
function trackingKeysIntersect({ read, change }) {
  if (read === change) {
    return true;
  }
  const readKey = splitKey(read);
  const changeKey = splitKey(change);
  if (readKey.namespace !== changeKey.namespace) {
    return false;
  }
  if (isWholeNamespace(readKey.path) || isWholeNamespace(changeKey.path)) {
    return true;
  }
  return (
    isBelow({ path: readKey.path, prefix: changeKey.path }) ||
    isBelow({ path: changeKey.path, prefix: readKey.path })
  );
}

export default trackingKeysIntersect;
