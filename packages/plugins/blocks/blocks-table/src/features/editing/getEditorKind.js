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

// The editor a cell type edits with (D8). Types without an editor (link, people, relation, json,
// image, html, progress, avatar, buttons, menu) are never editable, even with `editable: true`.
const EDITOR_KINDS = {
  text: 'text',
  email: 'text',
  phone: 'text',
  url: 'text',
  number: 'number',
  currency: 'number',
  percent: 'number',
  date: 'date',
  datetime: 'datetime',
  boolean: 'boolean',
  tag: 'select',
  status: 'select',
  tags: 'multiSelect',
  rating: 'rating',
};

function getEditorKind(cellType) {
  return EDITOR_KINDS[cellType] ?? null;
}

export default getEditorKind;
