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

function withoutMarkers(value) {
  if (!type.isObject(value)) return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !key.startsWith('~')));
}

// Which database a connection reads, as far as the built artifact can tell before any request:
// a literal databaseName (or none) and the databaseUri's _secret name (or literal). Returns null
// when either is computed per request, since such a connection cannot be compared.
function describeDatabaseTarget({ properties }) {
  const databaseName = properties?.databaseName;
  if (!type.isUndefined(databaseName) && !type.isString(databaseName)) return null;
  const databaseUri = withoutMarkers(properties?.databaseUri);
  let uri;
  if (type.isString(databaseUri)) {
    uri = `literal:${databaseUri}`;
  } else if (
    type.isObject(databaseUri) &&
    Object.keys(databaseUri).length === 1 &&
    type.isString(databaseUri._secret)
  ) {
    uri = `secret:${databaseUri._secret}`;
  } else {
    return null;
  }
  return { databaseName: databaseName ?? null, uri };
}

export default describeDatabaseTarget;
