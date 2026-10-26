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

import fillTemplate from './fillTemplate.js';
import fillText from './fillText.js';
import getActor from './getActor.js';
import selectEventRule from './selectEventRule.js';

/**
 * One event as a line: its icon, tone, sentence segments and an optional note under it. An
 * entry's own `text`, `icon` and `tone` win over its rule, so an app can send lines already
 * worded.
 *
 * @param {Object} params
 * @param {Object} params.entry The event.
 * @param {Object} [params.formatEvent]
 * @param {Array} [params.members]
 * @returns {{ actor: Object, icon: string, tone: string, segments: Array, note: string|null }}
 */
function describeEvent({ entry, formatEvent, members }) {
  const actor = getActor({ by: entry.by, members });
  const rule = selectEventRule({ entry, formatEvent });
  const template = type.isString(entry.text) ? entry.text : rule.text;
  let note = null;
  if (type.isString(entry.note)) {
    note = entry.note;
  } else if (type.isString(rule.note)) {
    note = fillText({ template: rule.note, entry });
  }
  return {
    actor,
    icon: entry.icon ?? rule.icon,
    tone: entry.tone ?? rule.tone,
    segments: fillTemplate({ template, entry, actor }),
    note: note === '' ? null : note,
  };
}

export default describeEvent;
