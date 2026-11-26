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

import findBrowserOnlyRecord from './findBrowserOnlyRecord.js';

// A journey of a headless run that an earlier headless run found needs a browser, on the same
// journey and build (findBrowserOnlyRecord), as the browser-only result running it again would
// give: the run lists it and doesn't run it up to its browser step again. `remembered` marks it
// in the report. Undefined for any other journey, which the run runs. `configHash` is the build
// this run starts on: hashBuild of the dev server's build, or the production build's buildId.
function rememberedBrowserOnly({ item, records, configDirectory, configHash }) {
  const record = findBrowserOnlyRecord({ records, configDirectory, item, configHash });
  if (type.isUndefined(record)) {
    return undefined;
  }
  return {
    name: item.journey.name,
    filePath: item.filePath,
    journey: item.journey,
    passed: false,
    stepCount: item.journey.steps.length,
    durationMs: 0,
    browserOnly: record.browserOnly,
    remembered: true,
  };
}

export default rememberedBrowserOnly;
