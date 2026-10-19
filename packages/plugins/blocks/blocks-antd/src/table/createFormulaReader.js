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

import renderPlaceholders from './renderPlaceholders.js';

// A formula column's value reader: its template's `{{ column }}` placeholders filled in as plain
// text (renderPlaceholders), never a template engine: formulas are user content shared between
// users, and a nunjucks template can run code in every viewer's browser. The column's type
// renders, escapes and sorts the text itself. The template sees the row's fields, `row` itself, and the values of the columns it references
// by key whose value is not a top-level row field (`refs`: enrichment, ai, extract and other
// formula columns). Results are cached per row object: rows keep their identity until their
// content changes (the table's key diff), so a sort, filter or search over the column renders
// each row's template once.
function createFormulaReader({ template, refs }) {
  const cache = new WeakMap();
  return function readFormula(row) {
    if (!type.isObject(row)) return undefined;
    if (cache.has(row)) return cache.get(row);
    const context = { ...row, row };
    refs.forEach((ref) => {
      context[ref.key] = ref.read(row);
    });
    const value = renderPlaceholders({ template, context });
    cache.set(row, value);
    return value;
  };
}

export default createFormulaReader;
