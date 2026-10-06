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

import { hashSequence, journeySequence } from '@lowdefy/node-utils';

// Bumped whenever what a journey is matched on changes (journeySequence,
// stepIdentity, or how journey text is read), so a refresh rehashes every
// journey instead of deprecating every flow at once.
const SEQUENCE_VERSION = 1;

// The id of the flow a journey's production evidence was counted for:
// `v<SEQUENCE_VERSION>-` and the hash of its entry page and its interactions
// as production segments are matched against them. Waits, other expectations,
// typed or picked values, rows and `nth` leave it unchanged. A click's text
// enters it only when isConfigText says it is config text, as evidence reads
// journeys, so the id changes exactly when what is matched changes. routeTable
// is the build's route table, read as production segments are read with it.
function sequenceId({ pageId, steps, routeTable, isConfigText }) {
  return `v${SEQUENCE_VERSION}-${hashSequence({
    pageId,
    sequence: journeySequence({ pageId, steps, routeTable, isConfigText }),
  })}`;
}

export { SEQUENCE_VERSION };
export default sequenceId;
