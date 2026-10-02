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
import { type } from '@lowdefy/helpers';

import getHubPaths from './getHubPaths.js';

const HOW_TO_FIX =
  'Fix the JSON or delete the file, then trust repositories again by running `lowdefy hub trust <directory>` in a terminal.';

// The repositories (real paths of their git common directories) the user
// allowed lowdefy mcp to use from any agent session, with `lowdefy hub trust`
// or "always allow".
function readTrustedRepositories() {
  const { trustedPath } = getHubPaths();
  let content;
  try {
    content = fs.readFileSync(trustedPath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
  let trusted;
  try {
    trusted = JSON.parse(content);
  } catch (error) {
    throw new Error(`${trustedPath} is not valid JSON (${error.message}). ${HOW_TO_FIX}`);
  }
  if (!type.isObject(trusted) || !type.isArray(trusted.repositories)) {
    throw new Error(`${trustedPath} has no "repositories" list. ${HOW_TO_FIX}`);
  }
  return trusted.repositories;
}

export default readTrustedRepositories;
