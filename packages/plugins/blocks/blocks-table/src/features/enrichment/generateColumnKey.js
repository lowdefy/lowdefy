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

// Keys the server refuses (`^[A-Za-z0-9_-]{1,128}$`, and never an object prototype name).
const RESERVED = new Set(['__proto__', 'constructor', 'prototype']);
const MAX_BASE_LENGTH = 120;

// A new column's key from its title: lowercase ASCII words joined with `_` (`Work email` becomes
// `work_email`, accents dropped), at most 120 characters, `column` for a title without letters
// or digits, and a `_2`, `_3`, ... suffix until it is neither one of `existingKeys` (every
// column's key) nor a reserved name. Keys always match the server's `^[A-Za-z0-9_-]{1,128}$`.
function generateColumnKey({ title, existingKeys }) {
  const base =
    (type.isString(title) ? title : '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/^(\d)/, '_$1')
      .slice(0, MAX_BASE_LENGTH)
      .replace(/_+$/, '') || 'column';
  const taken = new Set(existingKeys);
  if (!taken.has(base) && !RESERVED.has(base)) return base;
  let index = 2;
  while (taken.has(`${base}_${index}`)) index += 1;
  return `${base}_${index}`;
}

export default generateColumnKey;
