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

import { relativePosixPath } from '@lowdefy/node-utils';

const TEST_FILE = /\.test\.m?js$/;

// The app's access table snapshot test: the first endpoint test under tests/endpoints/ that calls
// accessMatrix, as a path from the config directory, or null when the app keeps none. Where it
// keeps one, that snapshot is the check of who reaches each page, so the role refusal variants
// would repeat it.
function findAccessSnapshotTest({ directories }) {
  const endpointsDirectory = path.join(directories.config, 'tests', 'endpoints');
  if (!fs.existsSync(endpointsDirectory)) {
    return null;
  }
  const files = fs
    .readdirSync(endpointsDirectory, { recursive: true })
    .filter((file) => TEST_FILE.test(file))
    .sort();
  const snapshotFile = files.find((file) =>
    fs.readFileSync(path.join(endpointsDirectory, file), 'utf8').includes('accessMatrix(')
  );
  if (snapshotFile === undefined) {
    return null;
  }
  return relativePosixPath({
    from: directories.config,
    to: path.join(endpointsDirectory, snapshotFile),
  });
}

export default findAccessSnapshotTest;
