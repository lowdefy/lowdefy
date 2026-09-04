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

// The trace file, and the pages it names. The page ids are read here so only
// those pages' build artifacts have to be loaded to resolve block types; a line
// that is not JSON is left for the compiler to count.
function readTrace({ context, traceFile }) {
  const filePath = path.resolve(context.directories.config, traceFile);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Trace file not found at ${filePath}.`);
  }
  const trace = fs.readFileSync(filePath, 'utf8');
  const pageIds = new Set();
  trace.split('\n').forEach((line) => {
    if (line.trim() === '') return;
    try {
      const row = JSON.parse(line);
      if (typeof row?.page_id === 'string') pageIds.add(row.page_id);
    } catch {
      return;
    }
  });
  return { filePath, pageIds: [...pageIds], trace };
}

export default readTrace;
