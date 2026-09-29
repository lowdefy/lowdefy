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
import { nunjucksFunction } from '@lowdefy/nunjucks';

import decodeHtmlEntities from './decodeHtmlEntities.js';

// A formula column's value reader: its nunjucks template, compiled once (the shared template
// path html cells use), rendered over the row as plain text: the autoescaped output is decoded
// (decodeHtmlEntities), so the column's type renders, escapes and sorts the text itself.
// The template sees the row's fields, `row` itself, and the values of the columns it references
// by key whose value is not a top-level row field (`refs`: enrichment, ai, extract and other
// formula columns). Results are cached per row object: rows keep their identity until their
// content changes (the table's key diff), so a sort, filter or search over the column renders
// each row's template once.
function createFormulaReader({ template, refs }) {
  const render = nunjucksFunction(template);
  const cache = new WeakMap();
  return function readFormula(row) {
    if (!type.isObject(row)) return undefined;
    if (cache.has(row)) return cache.get(row);
    const context = { ...row, row };
    refs.forEach((ref) => {
      context[ref.key] = ref.read(row);
    });
    const value = decodeHtmlEntities(render(context));
    cache.set(row, value);
    return value;
  };
}

export default createFormulaReader;
