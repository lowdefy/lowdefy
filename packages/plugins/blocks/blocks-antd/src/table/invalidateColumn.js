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

const KIND_FIELDS = [
  'kind',
  'computed',
  'stateField',
  'inputSources',
  'read',
  'template',
  'provider',
  'prompt',
  'inputs',
  'output',
  'autoRun',
  'source',
  'extractPath',
];

// Turns a user-defined column whose config is invalid into an error column, in place: `invalid`
// holds the reason, and the kind's keys go, so it never runs, reads another column or is read
// as an input. The Table shows its cells as "Invalid column: <reason>", marks its header and
// offers Edit and Delete in its header menu. A user wrote the config at runtime, so one bad
// column must not take the table down; a declared column's config error still throws.
function invalidateColumn({ column, reason }) {
  KIND_FIELDS.forEach((name) => {
    delete column[name];
  });
  Object.assign(column, {
    invalid: reason,
    userDefined: true,
    type: 'text',
    sortable: false,
    filterable: false,
    groupable: false,
    editable: false,
    searchable: false,
    aggregate: undefined,
  });
  return column;
}

export default invalidateColumn;
