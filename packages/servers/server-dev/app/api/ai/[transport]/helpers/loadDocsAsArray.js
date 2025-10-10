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

function loadDocsAsArray(docType) {
  try {
    const docsDir = path.join(process.cwd(), 'build', 'docs', docType);

    const files = fs.readdirSync(docsDir);

    const docs = [];

    files.forEach((file) => {
      if (file.endsWith('.md')) {
        const title = file.replace('.md', '');

        const doc = {
          title: title,
          description: 'Description to be added.', // TODO: Extract description from md file
        };
        docs.push(doc);
      }
    });

    return docs;
  } catch (error) {
    return [];
  }
}

export default loadDocsAsArray;
