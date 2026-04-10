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

import fs from 'fs/promises';
import path from 'path';

import resolvePath from '../resolvePath.js';
import schema from './schema.js';

async function FileSystemStat({ connection, request }) {
  const filePath = resolvePath(connection.basePath, request.path);
  const stats = await fs.stat(filePath);
  return {
    name: path.basename(filePath),
    path: request.path,
    size: stats.size,
    type: stats.isDirectory() ? 'directory' : 'file',
    modified: stats.mtime.toISOString(),
    created: stats.birthtime.toISOString(),
  };
}

FileSystemStat.schema = schema;
FileSystemStat.meta = {
  checkRead: true,
  checkWrite: false,
};

export default FileSystemStat;
