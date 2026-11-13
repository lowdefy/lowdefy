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
import { type } from '@lowdefy/helpers';
import { relativePosixPath } from '@lowdefy/node-utils';

// The app's access table snapshot, as a path from the config directory, or null when it keeps
// none: a test file under tests/ that calls accessMatrix, with the snapshot node --test writes
// beside it (<file>.snapshot) committed. Such an app already proves who reaches each page.
function findAccessTableSnapshot({ configDirectory }) {
  const testsDirectory = path.join(configDirectory, 'tests');
  if (!fs.existsSync(testsDirectory)) {
    return null;
  }
  const found = fs
    .readdirSync(testsDirectory, { recursive: true })
    .filter((fileName) => /\.test\.m?js$/.test(fileName))
    .sort()
    .map((fileName) => path.join(testsDirectory, fileName))
    .find(
      (filePath) =>
        fs.existsSync(`${filePath}.snapshot`) &&
        fs.readFileSync(filePath, 'utf8').includes('accessMatrix(')
    );
  return type.isUndefined(found)
    ? null
    : relativePosixPath({ from: configDirectory, to: `${found}.snapshot` });
}

export default findAccessTableSnapshot;
