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

import getMailOutboxDirectory from './getMailOutboxDirectory.js';

// The messages the dev mail sink has captured this session, oldest first. The
// sink names each file by its receive sequence and writes it in one rename, so
// a listing never sees half a message.
async function readMailOutbox({ configDirectory }) {
  const directory = getMailOutboxDirectory({ configDirectory });
  const fileNames = (await fs.promises.readdir(directory))
    .filter((fileName) => fileName.endsWith('.json'))
    .sort();
  return Promise.all(
    fileNames.map(async (fileName) =>
      JSON.parse(await fs.promises.readFile(path.join(directory, fileName), 'utf8'))
    )
  );
}

export default readMailOutbox;
