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

async function statIfExists(filePath) {
  try {
    return await fs.stat(filePath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

// Sizes are compared first, so a changed file of a new length costs two stats
// and no reads.
async function filesHaveSameBytes({ a, b }) {
  const [statsA, statsB] = await Promise.all([statIfExists(a), statIfExists(b)]);
  if (statsA === null || statsB === null || statsA.size !== statsB.size) {
    return false;
  }
  const [bytesA, bytesB] = await Promise.all([fs.readFile(a), fs.readFile(b)]);
  return bytesA.equals(bytesB);
}

export default filesHaveSameBytes;
