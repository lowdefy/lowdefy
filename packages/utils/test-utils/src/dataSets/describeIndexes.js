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

// A collection's indexes as one string, sorted by name, to tell whether a collection still has
// exactly the indexes it was loaded with: a name, a key or an option (unique, hidden) that
// changed shows.
function describeIndexes(indexes) {
  return JSON.stringify(
    [...indexes].sort((first, second) => first.name.localeCompare(second.name))
  );
}

export default describeIndexes;
