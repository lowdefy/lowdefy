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

// A bound on the text a node puts in the page, not its visible length: the tree cuts previews to
// its width with CSS, and the node's title holds the value (cut at the same bound).
const MAX_TEXT = 2000;

// The one-line preview of a JSON tree node: primitives as JSON (strings quoted, at most 2000
// characters), objects and arrays by their size.
function formatJsonPreview(value) {
  if (type.isArray(value)) return `[${value.length} ${value.length === 1 ? 'item' : 'items'}]`;
  if (type.isDate(value)) return value.toISOString();
  if (type.isObject(value)) {
    const count = Object.keys(value).length;
    return `{${count} ${count === 1 ? 'key' : 'keys'}}`;
  }
  if (type.isUndefined(value)) return 'undefined';
  const text = JSON.stringify(value);
  return text.length > MAX_TEXT ? `${text.slice(0, MAX_TEXT - 1)}…` : text;
}

export default formatJsonPreview;
