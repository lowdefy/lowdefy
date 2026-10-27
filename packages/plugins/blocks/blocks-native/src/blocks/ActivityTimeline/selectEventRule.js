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

import { get, type } from '@lowdefy/helpers';

export const DEFAULT_RULE = {
  icon: 'Dot',
  tone: 'neutral',
  text: '{actor} {type|words}',
  summary: 'made {n} change{s}',
};

// A rule's `when` matches when every path in it holds the value given: null matches a missing
// value, and a list matches any value in it.
function matches({ entry, when }) {
  if (!type.isObject(when)) {
    return true;
  }
  return Object.entries(when).every(([path, expected]) => {
    const value = get(entry, path, { default: null });
    if (type.isArray(expected)) {
      return expected.some((option) =>
        type.isNone(option) ? type.isNone(value) : option === value
      );
    }
    if (type.isNone(expected)) {
      return type.isNone(value);
    }
    return value === expected;
  });
}

/**
 * How an event is drawn: the first rule for its type in `formatEvent` whose `when` matches,
 * over `formatEvent.default`, over the block's default rule. `formatEvent[type]` is one rule or a
 * list of rules.
 *
 * @param {Object} params
 * @param {Object} params.entry The event.
 * @param {Object} [params.formatEvent] Rules by event type, and `default`.
 * @returns {{ icon: string, tone: string, text: string, summary: string, note?: string }}
 */
function selectEventRule({ entry, formatEvent }) {
  const rules = formatEvent ?? {};
  const base = { ...DEFAULT_RULE, ...(type.isObject(rules.default) ? rules.default : {}) };
  const forType = Object.hasOwn(rules, entry.type) ? rules[entry.type] : null;
  const candidates = type.isArray(forType) ? forType : [forType];
  const rule = candidates.find(
    (candidate) => type.isObject(candidate) && matches({ entry, when: candidate.when })
  );
  return { ...base, ...(rule ?? {}) };
}

export default selectEventRule;
