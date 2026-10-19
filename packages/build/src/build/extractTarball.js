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

import fs from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';

import { Unpack } from 'tar';

async function extractTarball({ body, destDir }) {
  fs.mkdirSync(destDir, { recursive: true });

  // GitHub tarballs have a top-level directory like {owner}-{repo}-{sha}/
  // We strip it so contents extract directly into destDir
  await pipeline(
    body,
    createGunzip(),
    new Unpack({
      cwd: destDir,
      strip: 1,
    })
  );
}

export default extractTarball;
