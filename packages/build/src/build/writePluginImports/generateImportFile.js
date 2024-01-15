/*
  Copyright 2020-2024 Lowdefy, Inc

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
import { nunjucksFunction } from '@lowdefy/nunjucks';

const template = `{%- for import in imports -%}
import { {{ import.originalTypeName }} as {{ import.typeName }} } from '{{ import.package }}/{{ importPath }}';
{% endfor -%}
export default {
  {% for import in imports -%}
  {{ import.typeName }},
  {% endfor -%}
};`;

function generateImportFile({ imports, importPath }) {
  const templateFn = nunjucksFunction(template);
  return templateFn({ imports, importPath });
}

export default generateImportFile;
