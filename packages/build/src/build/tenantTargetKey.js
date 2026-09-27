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

import { get, type } from '@lowdefy/helpers';

// The connection type declares where its properties name the physical
// collection (connectionMetas tenantTarget): the database properties, the
// collection property, and the change-log collection property. Two targets
// match when their collection names are the same literal string and their
// database properties are equal as authored. A name resolved at runtime
// (_secret, _payload) can not be compared, so it has no key (null).
//
// The collection is passed in - the connection's own collection, its change-log
// collection, or a collection an aggregation stage writes into - and resolved
// against the connection's type and database.

function comparable(value) {
  return JSON.stringify(value ?? null, (key, item) => (key.startsWith('~') ? undefined : item));
}

function tenantTargetKey({ connection, tenantTarget, collection }) {
  if (!type.isString(collection)) {
    return null;
  }
  const database = tenantTarget.database.map((path) => get(connection.properties, path));
  return comparable([connection.type, database, collection]);
}

export default tenantTargetKey;
