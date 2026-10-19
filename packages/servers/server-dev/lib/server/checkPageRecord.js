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

import hashConfigContent from './hashConfigContent.js';

async function readHash({ filePath, readConfigFile }) {
  try {
    return hashConfigContent(await readConfigFile(filePath));
  } catch {
    // A file that cannot be read now (EACCES, or EBUSY on Windows during a
    // save) is treated as changed; the rebuild reads it again and reports it.
    return null;
  }
}

// Whether the inputs of a page's last build are unchanged: 'current' when every
// file it read still holds the content it read, else 'changed'. A build that
// ran app code is always 'changed': app code can read anything, so its record
// cannot be complete. Files are read through the build context's read cache,
// so pages that share a file read it once per change event.
async function checkPageRecord({ record, readConfigFile }) {
  if (record.ranAppCode) return 'changed';
  const recorded = [...record.files];
  const hashes = await Promise.all(
    recorded.map(([filePath]) => readHash({ filePath, readConfigFile }))
  );
  const unchanged = recorded.every(([, hash], index) => hashes[index] === hash);
  return unchanged ? 'current' : 'changed';
}

export default checkPageRecord;
