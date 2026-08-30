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

import path from 'path';

const SNAPSHOTS_DIRECTORY = 'snapshots';
const DIFF_DIRECTORY = path.join('.lowdefy', 'snapshot-diff');

const ARTEFACTS = ['screenshot.png', 'dom.html', 'state.json'];

// One place that knows the on-disk layout: snapshots/<pageId>/<user>/ for the
// committed goldens, .lowdefy/snapshot-diff/<pageId>/<user>/ for pixel diffs.
function snapshotPaths({ configDirectory, target }) {
  const goldenDirectory = path.join(
    configDirectory,
    SNAPSHOTS_DIRECTORY,
    target.pageId,
    target.user
  );
  const diffDirectory = path.join(configDirectory, DIFF_DIRECTORY, target.pageId, target.user);
  return {
    goldenDirectory,
    screenshot: path.join(goldenDirectory, 'screenshot.png'),
    dom: path.join(goldenDirectory, 'dom.html'),
    state: path.join(goldenDirectory, 'state.json'),
    diffDirectory,
    diff: path.join(diffDirectory, 'diff.png'),
    // Relative to the config directory, for log lines.
    label: path.join(SNAPSHOTS_DIRECTORY, target.pageId, target.user),
  };
}

export { ARTEFACTS, SNAPSHOTS_DIRECTORY, DIFF_DIRECTORY };
export default snapshotPaths;
