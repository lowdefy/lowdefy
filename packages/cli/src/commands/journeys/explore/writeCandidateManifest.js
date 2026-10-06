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

const MANIFEST_FILE = '.generated.json';

function hashText(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listFiles(entryPath);
    return entry.name === MANIFEST_FILE ? [] : [entryPath];
  });
}

function relativeKey({ directory, filePath }) {
  return path.relative(directory, filePath).split(path.sep).join('/');
}

// Records a hash of each candidate a run kept, in .generated.json in the
// run's candidate folder, so a later run can tell a file someone edited (the
// hash no longer matches) from one left as generated: the variants writer's
// test, with the hashes kept beside the files instead of in a header line a
// candidate moved into tests/journeys/ would carry along.
function writeCandidateManifest({ directory, files }) {
  const hashes = {};
  files.forEach((filePath) => {
    hashes[relativeKey({ directory, filePath })] = hashText(fs.readFileSync(filePath, 'utf8'));
  });
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(
    path.join(directory, MANIFEST_FILE),
    `${JSON.stringify({ files: hashes }, null, 2)}\n`
  );
}

// Whether every file in a run's candidate folder is as the run wrote it. A
// file someone edited or added, or a folder holding files but no manifest,
// is not; a candidate moved out of the folder leaves nothing to check.
function isCandidateFolderUnedited({ directory }) {
  const files = listFiles(directory);
  const manifestPath = path.join(directory, MANIFEST_FILE);
  if (!fs.existsSync(manifestPath)) return files.length === 0;
  let hashes;
  try {
    hashes = JSON.parse(fs.readFileSync(manifestPath, 'utf8')).files ?? {};
  } catch {
    // A manifest someone broke vouches for nothing.
    return false;
  }
  return files.every(
    (filePath) =>
      hashes[relativeKey({ directory, filePath })] === hashText(fs.readFileSync(filePath, 'utf8'))
  );
}

export { isCandidateFolderUnedited };
export default writeCandidateManifest;
