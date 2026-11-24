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

import { type } from '@lowdefy/helpers';
import { relativePosixPath } from '@lowdefy/node-utils';

import hashJourney from './hashJourney.js';

// The record of an earlier headless run on the dev server that found this journey needs a
// browser, while the journey is unchanged (hashJourney), or undefined. A record from the
// production build carries no config hash (writeHeadlessRun) and is never one. `records` is
// headless-run.json's journeys (readHeadlessRun).
function findBrowserOnlyRecord({ records, configDirectory, item }) {
  const file = relativePosixPath({ from: configDirectory, to: item.filePath });
  const record = records[`${file}#${item.journey.name}`];
  if (
    type.isNone(record?.browserOnly) ||
    record.hash !== hashJourney(item.journey) ||
    (record.configHashes ?? []).length === 0
  ) {
    return undefined;
  }
  return record;
}

export default findBrowserOnlyRecord;
