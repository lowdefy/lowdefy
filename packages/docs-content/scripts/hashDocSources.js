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

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

// A hash of the files a docs page is built from (its page file and every file
// it references), recorded at extraction and recomputed by the docs app's
// tests to find pages whose extracted content is stale. Line endings are
// normalised, so a Windows checkout hashes like any other. A file that no
// longer exists hashes as missing, so the page counts as changed.
function hashDocSources({ configDirectory, files }) {
  const hash = crypto.createHash('sha256');
  files.forEach((file) => {
    const filePath = path.resolve(configDirectory, file);
    const content = fs.existsSync(filePath)
      ? fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n')
      : '\0missing';
    hash.update(`${file}\0${content}\0`);
  });
  return hash.digest('hex');
}

export default hashDocSources;
