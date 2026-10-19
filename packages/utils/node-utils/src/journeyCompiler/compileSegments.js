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

import describeSegments from './describeSegments.js';
import publicSegment from './publicSegment.js';

const SOURCES = ['production', 'journey'];

// v1 trace records in, every segment's sequence out, for evidence, coverage
// and the measured test run. Pure - it neither reads nor writes files.
//
// `routeTable` ({ routes, basePath }, the build's routes.json and config
// basePath) is how a segment's sequence reads the page a navigation by click
// landed on (journeySequence). `filters` ({ since, until }) bound the window.
// Production records hold config text or a clicked-text token; the readers
// resolve a token to text only when it is config text. Returns { segments,
// dropped }, dropped counting the invalid and other-version records.
function compileSegments({ records, blockMetas = {}, routeTable, source, filters = {} }) {
  if (!SOURCES.includes(source)) {
    throw new Error(
      `compileSegments requires "source" to be one of ${SOURCES.join(
        ', '
      )}. Received ${JSON.stringify(source)}.`
    );
  }
  const { segments, dropped } = describeSegments({
    records,
    blockMetas,
    routeTable,
    source,
    filters,
  });
  return { segments: segments.map(publicSegment), dropped };
}

export default compileSegments;
