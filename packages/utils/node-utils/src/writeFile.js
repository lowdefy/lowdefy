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
import { promisify } from 'util';
import { type } from '@lowdefy/helpers';

const mkdirPromise = promisify(fs.mkdir);
const writeFilePromise = promisify(fs.writeFile);

async function writeFile(filePath, content) {
  if (!type.isString(filePath)) {
    throw new Error(
      `Could not write file, file path should be a string, received ${JSON.stringify(filePath)}.`
    );
  }

  try {
    await writeFilePromise(path.resolve(filePath), content);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await mkdirPromise(path.dirname(filePath), { recursive: true });
      await writeFilePromise(filePath, content);
      return;
    }
    throw error;
  }
}

export default writeFile;
