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

// Notes the indexes a collection of a session database was loaded with (loadDataSetCollection,
// described by describeIndexes), which a reset checks the collection against (reloadDataSession).
function recordIndexes({ session, databaseName, collectionName, indexes }) {
  if (!session.loadedIndexes.has(databaseName)) {
    session.loadedIndexes.set(databaseName, new Map());
  }
  session.loadedIndexes.get(databaseName).set(collectionName, indexes);
}

export default recordIndexes;
