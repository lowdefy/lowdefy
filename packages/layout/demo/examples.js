/*
  Copyright 2020 Lowdefy, Inc

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

import YAML from 'js-yaml';
import basic from './examples/basic.yaml';
import grid from './examples/grid.yaml';
import kanban from './examples/kanban.yaml';
import complex from './examples/complex.yaml';
import row from './examples/row.yaml';
import col from './examples/col.yaml';

const dumpYaml = (data) => {
  if (!data) {
    return '';
  }
  return YAML.dump(data, {
    // sortKeys: true,
    noRefs: true,
  });
};

const addBlocks = (acc, title, blocks) => {
  acc.push({
    id: 'grids',
    type: 'Markdown',
    properties: {
      content: title,
    },
  });
  (blocks || []).forEach((ex) => {
    acc.push({
      id: 'p',
      type: 'Markdown',
      properties: {
        content: `\`\`\`\`yaml
${dumpYaml(ex)}
`,
      },
    });
    acc.push(ex);
  });
};

const getEx = () => {
  const m = [];
  addBlocks(m, ' # Basic Layouts', basic);
  addBlocks(m, ' # Col Options', col);
  addBlocks(m, ' # Row Options', row);
  addBlocks(m, ' # Grid Layouts', grid);
  addBlocks(m, ' # Kanban Layouts', kanban);
  addBlocks(m, ' # Complex Layouts', complex);
  return m;
};

const examples = {
  id: 'page',
  type: 'Page',
  areas: {
    content: {
      blocks: [...getEx()],
    },
  },
};

export default examples;
