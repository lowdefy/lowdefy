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

import fs from 'fs';
import path from 'path';
import { nunjucksFunction } from '@lowdefy/nunjucks';

const template = `@import '@lowdefy/layout/style.less';
@import '@lowdefy/client/style.less';
{% for style in styles -%}
@import '{{ style }}';
{% endfor -%}
{% if importUserStyles %}
@import '../../public/styles.less';
{% endif %}
`;

async function writeStyleImports({ components, context }) {
  const templateFn = nunjucksFunction(template);
  await context.writeBuildArtifact(
    'plugins/styles.less',
    templateFn({
      styles: components.imports.styles,
      importUserStyles: fs.existsSync(path.join(context.directories.config, 'public/styles.less')),
    })
  );
}

export default writeStyleImports;
