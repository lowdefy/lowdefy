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

// The session database a database target (describeTargetKey) reads. Each target the build names has
// its own, numbered when the session opens; a target the build did not name (a config mutant's, say)
// gets the next number when first met, so it never merges with another. A target computed per
// request (null) reads the session's first database.
function sessionDatabaseName({ session, target }) {
  if (type.isNone(target)) return session.databaseName;
  if (!session.databases.has(target)) {
    session.databases.set(target, `${session.prefix}_${session.databaseCount}`);
    session.databaseCount += 1;
  }
  return session.databases.get(target);
}

export default sessionDatabaseName;
