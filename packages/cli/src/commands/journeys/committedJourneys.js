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

import collapseRuns from '../test/collapseRuns.js';
import expandJourney from '../test/expandJourney.js';
import validateJourneyItem from '../test/validateJourneyItem.js';

// The committed journeys behind discovered or selected test items, each once:
// discovered items are expanded as selected ones are (a selected run expands
// to itself), and a journey's runs collapse as collapseRuns says. Each comes
// with its place in its file and its path relative to the config directory.
// A file that does not parse, or a journey that does not validate, is
// reported in `skipped` and left alone.
function committedJourneys({ context, items }) {
  const journeys = [];
  const skipped = [];
  const runs = items.flatMap((item) => expandJourney({ item }));
  collapseRuns({ items: runs }).forEach((item) => {
    const file = relativePosixPath({ from: context.directories.config, to: item.filePath });
    if (!type.isNone(item.error)) {
      skipped.push(`${file}: ${item.error}`);
      return;
    }
    const validation = validateJourneyItem({ item });
    if (!validation.valid) {
      skipped.push(`${file}: ${validation.message}`);
      return;
    }
    journeys.push({
      filePath: item.filePath,
      file,
      journeyIndex: item.journeyIndex,
      journey: item.journey,
    });
  });
  return { journeys, skipped };
}

export default committedJourneys;
