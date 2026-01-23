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

import { readFile } from 'fs/promises';
import path from 'path';

function checkMockUserWarning(context) {
  return async () => {
    // Check env var first
    if (process.env.LOWDEFY_DEV_USER) {
      context.logger.warn('Mock user active - login bypassed');
      return;
    }

    // Check auth.json after build
    try {
      const authJsonPath = path.join(context.directories.build, 'auth.json');
      const authJsonContent = await readFile(authJsonPath, 'utf8');
      const authJson = JSON.parse(authJsonContent);
      if (authJson.dev?.mockUser) {
        context.logger.warn('Mock user active - login bypassed');
      }
    } catch {
      // auth.json may not exist if auth is not configured
    }
  };
}

export default checkMockUserWarning;
