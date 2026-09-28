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

import { renderHtml } from '@lowdefy/block-utils';
import { type } from '@lowdefy/helpers';

import isEmptyValue from '../isEmptyValue.js';

// A nunjucks `template` rendered with `{ value, row }` (autoescaped: use
// `| safe` to insert HTML from a field), or the value itself as HTML. Both go
// through renderHtml, which sanitises and wires `data-event` attributes.
function HtmlCell({ value, row, column, methods }) {
  const { template } = column.cell;
  let html = value;
  if (type.isString(template)) {
    html = column.compiled.template({ value, row });
  }
  if (isEmptyValue(html)) return null;
  return renderHtml({ html: String(html), methods });
}

export default HtmlCell;
