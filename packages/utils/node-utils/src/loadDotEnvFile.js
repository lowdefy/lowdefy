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
import { parseEnv } from 'node:util';

// Loads an app's .env file into process.env with Node's own .env parser, the one
// process.loadEnvFile uses. process.loadEnvFile itself is not used: it never overwrites a
// variable that is already set, which the dev server's reload of a changed .env needs, and it
// reads a leading byte order mark as part of the first variable's name, so that variable is lost.
// A variable already in the environment is kept unless override is true, as dotenv did.
function loadDotEnvFile({ filePath, override = false }) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    // An app need not have a .env file.
    if (error.code === 'ENOENT') return;
    throw error;
  }
  const variables = parseEnv(content.replace(/^﻿/, ''));
  Object.entries(variables).forEach(([name, value]) => {
    if (override || !Object.hasOwn(process.env, name)) {
      process.env[name] = value;
    }
  });
}

export default loadDotEnvFile;
