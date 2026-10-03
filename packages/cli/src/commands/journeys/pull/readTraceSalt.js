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

const SALT_BYTES = 32;

// The machine-local salt production ids are hashed with: 32 random bytes in
// .lowdefy/traces/production/salt, written on the first pull and never sent
// or committed. `saltId` (8 hex of its SHA-256) goes on each day manifest so a
// day hashed under another salt is pulled again.
function readTraceSalt({ directories }) {
  const directory = path.join(directories.traces, 'production');
  const saltPath = path.join(directory, 'salt');
  let salt;
  if (fs.existsSync(saltPath)) {
    salt = fs.readFileSync(saltPath);
  } else {
    fs.mkdirSync(directory, { recursive: true });
    salt = crypto.randomBytes(SALT_BYTES);
    fs.writeFileSync(saltPath, salt, { mode: 0o600 });
  }
  const saltId = crypto.createHash('sha256').update(salt).digest('hex').slice(0, 8);
  return { salt, saltId };
}

export default readTraceSalt;
