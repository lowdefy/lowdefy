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

// The cell types a user-defined column (`userDefined: true`) can have. User columns are runtime
// data one user writes and every viewer's browser renders, so only types that show a value as
// text (or a scheme-checked link) are allowed: no `html` (markup), `image`, `avatar` or `people`
// (they load URLs from the data, which tracks viewers), `link` or `relation` (they need cell
// config) and no action types. The add-column picker offers this list, and apps should check
// stored columns against it too.
const USER_COLUMN_TYPES = [
  'text',
  'email',
  'phone',
  'url',
  'number',
  'currency',
  'percent',
  'progress',
  'rating',
  'date',
  'datetime',
  'boolean',
  'tag',
  'tags',
  'status',
  'json',
];

export default USER_COLUMN_TYPES;
