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

const PLACEHOLDER = /\{\{-?(.*?)-?\}\}/gs;
const PATH = /^\s*[A-Za-z_$][\w$-]*(\.[\w$-]+)*\s*$/;

// Why a user-writable template (a formula column's `template`, an ai column's `prompt`) is
// refused, or null. Both only take `{{ column }}` placeholders (a key or a dot path), filled in
// as plain text: a template engine would run the template as code, so tags (`{% %}`),
// comments (`{# #}`) and expressions (`{{ a | upper }}`, `{{ f() }}`) are refused where a
// column is saved and where it is read.
function findTemplateProblem(template) {
  if (!type.isString(template)) return null;
  if (template.includes('{%') || template.includes('{#')) {
    return 'Only {{ column }} placeholders are supported: template tags ({% %}) and comments ({# #}) are not.';
  }
  for (const match of template.matchAll(PLACEHOLDER)) {
    if (!PATH.test(match[1])) {
      return `Only {{ column }} placeholders are supported: "${match[0]}" is an expression.`;
    }
  }
  return null;
}

export default findTemplateProblem;
