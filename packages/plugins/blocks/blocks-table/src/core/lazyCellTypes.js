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

// Cell types that render as more than text (chips, avatars, sanitised html, bars, the Link
// component, antd Buttons). While the grid scrolls fast, cells of these types that come into view
// render a cheap placeholder and upgrade once the scroll settles (D10.4); `buttons` also mount
// only on demand (tier 1, see LazyCell).
const LAZY_CELL_TYPES = new Set([
  'avatar',
  'buttons',
  'html',
  'image',
  'link',
  'people',
  'progress',
  'rating',
  'relation',
  'status',
  'tag',
  'tags',
]);

export default LAZY_CELL_TYPES;
