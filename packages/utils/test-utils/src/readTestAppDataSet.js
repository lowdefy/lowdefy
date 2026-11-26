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

import { deepFreeze } from '@lowdefy/node-utils';

import { readDataSet } from './dataSets/index.js';

// The data set `name` as readDataSet reads it, read once per test app: every session of a run
// opened on one data set shares it, so its YAML is parsed and its documents generated once. The
// config is not watched during a run. The value is frozen, since sessions share it; seeding copies
// each document before it is inserted (deserializeFixture). A data set that fails to read is not
// kept, so every session on it fails with its message.
function readTestAppDataSet({ name, testApp }) {
  if (!testApp.dataSets.has(name)) {
    const { build, config } = testApp.directories;
    const reading = readDataSet({ configDirectory: config, buildDirectory: build, name }).then(
      deepFreeze
    );
    reading.catch(() => testApp.dataSets.delete(name));
    testApp.dataSets.set(name, reading);
  }
  return testApp.dataSets.get(name);
}

export default readTestAppDataSet;
