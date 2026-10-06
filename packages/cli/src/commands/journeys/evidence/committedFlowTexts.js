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

import { normaliseClickText } from '@lowdefy/node-utils';
import { type } from '@lowdefy/helpers';

import parseFlowLines from './parseFlowLines.js';

// A flow line's click text. A hand-edited line whose identity is not JSON
// matches no segment, so it has no text to resolve either.
function clickText({ identity }) {
  let parsed;
  try {
    parsed = JSON.parse(identity);
  } catch {
    return null;
  }
  if (!type.isArray(parsed) || parsed[0] !== 'click') return null;
  return normaliseClickText(parsed[3]);
}

// The click texts the committed journeys' production flows match on, live and
// deprecated. Each was config text when its flow was written, and is already
// in the repository, so a refresh resolves production clicks to these texts
// as well as to today's config text: after a label is renamed, the old
// label's clicks still read as the old label, and a recount of the flow that
// clicked it keeps its months instead of counting them as 0.
function committedFlowTexts({ journeys }) {
  const texts = new Set();
  journeys.forEach(({ journey }) => {
    const production = journey.evidence?.production;
    if (!type.isObject(production)) return;
    [production, ...(production.deprecated ?? [])]
      .filter((entry) => type.isArray(entry?.flow))
      .forEach((entry) => {
        parseFlowLines({ flow: entry.flow }).forEach(({ identity }) => {
          const text = clickText({ identity });
          if (!type.isNull(text)) texts.add(text);
        });
      });
  });
  return texts;
}

export default committedFlowTexts;
