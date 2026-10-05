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
import { type } from '@lowdefy/helpers';

import readTraceSalt from './readTraceSalt.js';

const SALT_BYTES = 32;

// The pull's salt: the machine's salt, or a new one written on the first
// pull. Readers use readTraceSalt and never create one, since a new salt
// would leave every day already pulled unresolvable.
function readOrCreateTraceSalt({ directories }) {
  const existing = readTraceSalt({ directories });
  if (!type.isNone(existing)) return existing;
  const directory = path.join(directories.traces, 'production');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'salt'), crypto.randomBytes(SALT_BYTES), { mode: 0o600 });
  return readTraceSalt({ directories });
}

export default readOrCreateTraceSalt;
