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

// What `run.journey` names a journey by in its recording: the file relative
// to the config directory, plus `#<name>` for a journey that has one, so the
// coverage report can tell which journey drove what.
function recordingJourneyName({ configDirectory, filePath, journey }) {
  const relative = path.relative(configDirectory, filePath).split(path.sep).join('/');
  if (typeof journey?.name === 'string' && journey.name !== '') {
    return `${relative}#${journey.name}`;
  }
  return relative;
}

export default recordingJourneyName;
