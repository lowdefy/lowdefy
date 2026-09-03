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
import { writeFile } from '@lowdefy/node-utils';

// Hook scripts are committed and reviewable, so a project may have edited one.
// Like the skills, an existing file is never overwritten - a rerun with the
// same CLI is a no-op, and a script that has fallen behind is reported rather
// than replaced behind the developer's back.
async function writeHookScript({ context, projectDirectory, relativePath, content }) {
  const filePath = path.join(projectDirectory, relativePath);
  if (fs.existsSync(filePath)) {
    if (fs.readFileSync(filePath, 'utf8') === content) {
      context.logger.info(`'${relativePath}' is up to date.`);
      return;
    }
    context.logger.info(
      `'${relativePath}' differs from the version this CLI ships - leaving it unchanged. Delete it and rerun 'lowdefy agent-setup' to regenerate it.`
    );
    return;
  }
  await writeFile(filePath, content);
  fs.chmodSync(filePath, 0o755);
  context.logger.info(`Created '${relativePath}'.`);
}

export default writeHookScript;
