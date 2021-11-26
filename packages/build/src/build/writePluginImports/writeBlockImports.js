/*
  Copyright 2020-2021 Lowdefy, Inc

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

const template = `{%- for block in blocks -%}
import { {{ block.type }} } from '{{ block.package }}/blocks';
{% endfor -%}
export default {
  {% for block in blocks -%}
  {{ block.type }},
  {% endfor -%}
};
`;

async function writeBlockImports({ components, context }) {
  const templateFn = nunjucksFunction(template);
  const blocks = Object.keys(components.types.blocks).map((type) => ({
    type,
    ...components.types.blocks[type],
  }));
  await context.writeBuildArtifact({
    filePath: 'plugins/blocks.js',
    content: templateFn({ blocks }),
  });
}

export default writeBlockImports;
