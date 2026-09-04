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

const template = `{%- for package in packages -%}
{% if package.icons.length %}import { {% for icon in package.icons -%}{% if not loop.last -%} {{ icon }}, {% else -%} {{ icon }} } from '{{ package.package }}';
{% endif -%}{% endfor %}{% endif %}{% endfor -%}
export default {
  {%- for package in packages -%}
  {%- for icon in package.icons %}
  {{ icon }},{% endfor %}
{%- endfor %}
};`;

// The names in the app-wide barrel, without the components. The client reads
// it to tell an icon name a page module is missing from a string that merely
// looks like one — it is the only way to know what the barrel could still
// provide without loading the barrel itself.
function iconNames({ packages }) {
  const names = new Set();
  packages.forEach(({ icons }) => icons.forEach((icon) => names.add(icon)));
  return [...names];
}

async function writeIconImports({ components, context }) {
  const templateFn = nunjucksFunction(template);
  await context.writeBuildArtifact(
    'plugins/icons.js',
    templateFn({ packages: components.imports.icons })
  );
  await context.writeBuildArtifact(
    'plugins/iconNames.js',
    `export default ${JSON.stringify(iconNames({ packages: components.imports.icons }))};\n`
  );
}

export default writeIconImports;
