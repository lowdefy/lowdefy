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

// The error for a changeset key that is not in `fields`. Changeset keys are the TableInput
// column field paths, while MongoDBTableQuery keys its fields by column key, so a key that is
// the path of a field keyed otherwise is named as that mismatch.
function notInFieldsError({ fieldsByKey, key, location }) {
  const byPath = [...fieldsByKey.values()].find((field) => field.path === key);
  const hint =
    byPath === undefined
      ? ''
      : ` The field "${byPath.key}" writes "${key}", but changeset keys are the TableInput column field paths, so key that field "${key}".`;
  return new Error(`MongoDBTableChanges ${location}: "${key}" is not in "fields".${hint}`);
}

export default notInFieldsError;
