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

// posthog-js's rage-click window.
const ATTACH_WINDOW_MS = 1000;

function sameTarget({ a, b }) {
  if (!type.isNone(a.block_id) || !type.isNone(b.block_id)) {
    return a.block_id === b.block_id && a.row === b.row && a.column === b.column;
  }
  return a.text === b.text;
}

// A $rageclick or $dead_click marks the latest click on the same target in
// the same tab within 1 s before it. With no such click (a dead click on an
// element autocapture does not record) it stands as its own click record.
// Entries are { record, id, blockIds }; returns the click entries with the
// unattached frustrations added.
function attachFrustration({ records, frustrations }) {
  const result = [...records];
  frustrations.forEach((entry) => {
    const time = Date.parse(entry.record.t);
    let match;
    records.forEach((candidate) => {
      const { record } = candidate;
      if (record.kind !== 'click' || record.session !== entry.record.session) return;
      if (!sameTarget({ a: record.target, b: entry.record.target })) return;
      const delay = time - Date.parse(record.t);
      if (delay < 0 || delay > ATTACH_WINDOW_MS) return;
      if (type.isUndefined(match) || Date.parse(record.t) >= Date.parse(match.record.t)) {
        match = candidate;
      }
    });
    if (type.isUndefined(match)) {
      result.push(entry);
      return;
    }
    match.record.frustration = entry.record.frustration;
  });
  return result;
}

export default attachFrustration;
