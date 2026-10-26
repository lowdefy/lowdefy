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

// How a Dynamic blocks policy reads a table's `data` (the `rowsKind` schema
// mark, @lowdefy/api dynamic/policy/findDataRows.js). When every column draws
// its cell as text, the rows are data: a URL or tag syntax in them is text.
// Any other column (a url, link or relation link, an image, avatar or people
// picture, html, or buttons and menus) draws or follows row values, so its
// table's rows keep every check. email and phone cells link with a fixed
// mailto: or tel: scheme. So do a column whose `cell.colorFrom` reads a row
// field into a tag's colour (a CSS value), and an `expandable.template`, which
// draws row fields through renderHtml.
const ROWS_KIND = {
  columns: 'columns',
  type: 'type',
  children: 'children',
  cell: 'cell',
  cellRowKeys: ['colorFrom'],
  drawnBy: ['expandable.template'],
  defaultType: 'text',
  textTypes: [
    'text',
    'email',
    'phone',
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
  ],
};

export default ROWS_KIND;
