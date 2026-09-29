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

import { get, type } from '@lowdefy/helpers';
import { nunjucksFunction } from '@lowdefy/nunjucks';

import htmlToText from './htmlToText.js';

// Compiles a column `tooltip` once into `(row, value) => string | undefined`:
// `{ field }` reads a row field, `{ template }` or a string renders a nunjucks
// template with `{ value, row }`. Tooltips are native (plain text), so a cell
// costs nothing until it is hovered.
function compileTooltip({ tooltip }) {
  if (type.isNone(tooltip)) return null;
  if (type.isObject(tooltip) && type.isString(tooltip.field)) {
    const { field } = tooltip;
    return (row) => {
      const text = get(row, field);
      return type.isNone(text) || text === '' ? undefined : String(text);
    };
  }
  const template = type.isObject(tooltip) ? tooltip.template : tooltip;
  if (!type.isString(template)) {
    throw new Error(
      `Table column tooltip must be a string, { field } or { template }. Received ${JSON.stringify(
        tooltip
      )}.`
    );
  }
  const render = nunjucksFunction(template);
  return (row, value) => {
    const text = htmlToText(render({ value, row }));
    return text === '' ? undefined : text;
  };
}

export default compileTooltip;
