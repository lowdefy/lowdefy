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

import fillText from './fillText.js';
import joinList from './joinList.js';
import selectEventRule from './selectEventRule.js';

/**
 * What a run of one actor's events did, said once: "edited the body and recorded 3 decisions".
 * Each event's `summary` template (its own, else its rule's) is filled from the event; events
 * whose summaries read the same are counted together, with `{n}` their count and `{s}` an "s"
 * when it is not 1. Phrases keep the order their first event came in.
 *
 * @param {Object} params
 * @param {Object[]} params.entries The events, oldest first.
 * @param {Object} [params.formatEvent]
 * @returns {string}
 */
function summariseEvents({ entries, formatEvent }) {
  const counts = new Map();
  entries.forEach((entry) => {
    const template = type.isString(entry.summary)
      ? entry.summary
      : selectEventRule({ entry, formatEvent }).summary;
    const phrase = fillText({ template, entry, keep: ['n', 's'] });
    counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
  });
  const phrases = [...counts.entries()].map(([phrase, count]) =>
    phrase.replaceAll('{n}', String(count)).replaceAll('{s}', count === 1 ? '' : 's')
  );
  return joinList(phrases);
}

export default summariseEvents;
