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

// Fixtures and indexes add up per connection, in load order, so the loader's rules apply across
// files as within one: a later fixture with an _id replaces an earlier one, and a later index with
// the same key replaces an earlier one. A later user with the same name replaces the earlier user.
function mergeDataSetFiles({ files }) {
  const fixtures = {};
  const indexes = {};
  const users = {};
  files.forEach((file) => {
    Object.entries(file.fixtures).forEach(([connectionId, documents]) => {
      fixtures[connectionId] = [...(fixtures[connectionId] ?? []), ...documents];
    });
    Object.entries(file.indexes).forEach(([connectionId, entries]) => {
      indexes[connectionId] = [...(indexes[connectionId] ?? []), ...entries];
    });
    Object.assign(users, file.users);
  });
  return { fixtures, indexes, users };
}

export default mergeDataSetFiles;
