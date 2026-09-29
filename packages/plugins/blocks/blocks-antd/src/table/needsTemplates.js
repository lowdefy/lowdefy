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

function isTemplateTooltip(tooltip) {
  if (type.isString(tooltip)) return true;
  return type.isObject(tooltip) && type.isString(tooltip.template);
}

// Whether a table's config uses a nunjucks template: an `html` cell's `template`, a tooltip
// template (a string or `{ template }`, not `{ field }`), or Table's `expandable.template`. Only
// then does the table load the template compiler (loadTemplateCompiler), which is too large to
// ship with every table.
function needsTemplates({ columns, expandable }) {
  if (type.isObject(expandable) && type.isString(expandable.template)) return true;
  return columns.some(
    (column) =>
      (column.type === 'html' && type.isString(column.cell?.template)) ||
      isTemplateTooltip(column.tooltip)
  );
}

export default needsTemplates;
