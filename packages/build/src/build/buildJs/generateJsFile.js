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

// A volatile function carries `volatile: true`, which the _js operator's tracking declaration reads.
// It is set inline so `export default` stays the first statement of the module.
const template = `
export default {
  {% for hash in hashes -%}
  {% if volatileHashes.has(hash) -%}
  '{{ hash }}': Object.assign(({{ functionPrototype }}) => { {{ map[hash] | safe }} }, { volatile: true }),
  {% else -%}
  '{{ hash }}': ({{ functionPrototype }}) => { {{ map[hash] | safe }} },
  {% endif -%}
  {% endfor -%}
};`;

function generateJsFile({ map, functionPrototype, volatileHashes = new Set() }) {
  const templateFn = nunjucksFunction(template);
  return templateFn({ hashes: Object.keys(map), map, functionPrototype, volatileHashes });
}

export default generateJsFile;
