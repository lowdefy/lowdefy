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
import { isTraceId, type } from '@lowdefy/helpers';

// Production traces are pulled and pruned by the production mining commands;
// this reader covers what the dev server writes.
const RECORDING_SOURCES = ['dev', 'journey', 'explorer'];
const DATE_DIRECTORY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function utcDate(date) {
  return date.toISOString().slice(0, 10);
}

function listDirectory(directory) {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true });
}

// The recording files of one source under
// `<config>/.lowdefy/traces/<source>/<yyyy-mm-dd>/<id>.jsonl`, oldest date
// first and by id within a date (ids start with their UTC time). Date
// directories before `since` (a Date) are skipped; files and directories that
// do not match the layout are ignored.
function listRecordingFiles({ configDirectory, source, since, run }) {
  if (!RECORDING_SOURCES.includes(source)) {
    throw new Error(
      `Recordings source should be one of ${RECORDING_SOURCES.join(
        ', '
      )}. Received ${JSON.stringify(source)}.`
    );
  }
  if (!type.isNone(since) && !type.isDate(since)) {
    throw new Error(`Recordings "since" should be a Date. Received ${JSON.stringify(since)}.`);
  }
  if (!type.isNone(run) && !isTraceId(run)) {
    throw new Error(`Recordings "run" should be a trace id. Received ${JSON.stringify(run)}.`);
  }
  const sourceDirectory = path.join(configDirectory, '.lowdefy', 'traces', source);
  const sinceDate = type.isNone(since) ? null : utcDate(since);
  const files = [];
  listDirectory(sourceDirectory)
    .filter((entry) => entry.isDirectory() && DATE_DIRECTORY_PATTERN.test(entry.name))
    .filter((entry) => sinceDate === null || entry.name >= sinceDate)
    .map((entry) => entry.name)
    .sort()
    .forEach((date) => {
      const dateDirectory = path.join(sourceDirectory, date);
      listDirectory(dateDirectory)
        .filter((entry) => entry.isFile() && entry.name.endsWith('.jsonl'))
        .map((entry) => entry.name.slice(0, -'.jsonl'.length))
        .filter((id) => isTraceId(id))
        .filter((id) => type.isNone(run) || id === run)
        .sort()
        .forEach((id) => {
          const filePath = path.join(dateDirectory, `${id}.jsonl`);
          files.push({ id, date, path: filePath, mtimeMs: fs.statSync(filePath).mtimeMs });
        });
    });
  return files;
}

export { RECORDING_SOURCES };
export default listRecordingFiles;
