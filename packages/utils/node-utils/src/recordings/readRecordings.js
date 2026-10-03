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

import listRecordingFiles from './listRecordingFiles.js';
import readRecordingFile from './readRecordingFile.js';

// Every record the dev server recorded for one source (`dev`, `journey` or
// `explorer`), in file then line order, as an array. `since` (a Date) skips
// files in date directories before its UTC date that were not written to
// since; `run` (a trace id) reads only that run's file. Callers filter records
// by time themselves: a file holds a whole session, so records before `since`
// can still be in it.
function readRecordings({ configDirectory, source, since, run }) {
  return listRecordingFiles({ configDirectory, source, since, run }).flatMap((file) =>
    readRecordingFile({ path: file.path })
  );
}

export default readRecordings;
