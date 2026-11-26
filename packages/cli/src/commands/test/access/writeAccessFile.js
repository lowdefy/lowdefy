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

import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

import getAccessFilePath from './getAccessFilePath.js';

const HEADER = [
  ' Who reaches each page and endpoint: allow, deny or enrol_required, as each user of the data',
  ' set "data" names and signed out (none). lowdefy test checks it on the production build;',
  ' rewrite it with lowdefy test --update-access and commit the change.',
].join('\n');

// Writes tests/access.yaml: the data set it is checked as, then one row per page and endpoint on
// one line each, in the order accessMatrix sorts them, so a change of reach is a one-line diff.
function writeAccessFile({ configDirectory, table }) {
  const document = new YAML.Document({
    data: table.data,
    pages: table.pages,
    endpoints: table.endpoints,
  });
  document.commentBefore = HEADER;
  ['pages', 'endpoints'].forEach((section) => {
    document.get(section).items.forEach((pair) => {
      pair.value.flow = true;
    });
  });
  const filePath = getAccessFilePath({ configDirectory });
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, document.toString({ lineWidth: 0 }));
}

export default writeAccessFile;
