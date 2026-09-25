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

import { nunjucksFunction } from '@lowdefy/nunjucks';

import getIconAliases from '../buildImports/getIconAliases.js';

const template = `{%- for package in packages -%}
{% if package.icons.length %}import { {% for icon in package.icons -%}{% if not loop.last -%} {{ icon }}, {% else -%} {{ icon }} } from '{{ package.package }}';
{% endif -%}{% endfor %}{% endif %}{% endfor -%}
export default {
  {%- for package in packages -%}
  {%- for icon in package.icons %}
  {{ icon }},{% endfor %}
{%- endfor %}
  {%- for alias in aliases %}
  '{{ alias.name }}': {{ alias.icon }},{% endfor %}
};`;

async function writeIconImports({ components, context }) {
  const templateFn = nunjucksFunction(template);
  const aliases = Object.entries(components.imports.iconAliases).map(([name, icon]) => ({
    icon,
    name,
  }));
  await context.writeBuildArtifact(
    'plugins/icons.js',
    templateFn({ aliases, packages: components.imports.icons })
  );
  // The full alias map, used or not: dev JIT resolves semantic names on pages
  // from it, and the dev docs server's icon search lists it.
  await context.writeBuildArtifact(
    'iconAliases.json',
    JSON.stringify(getIconAliases({ components }))
  );
}

export default writeIconImports;
