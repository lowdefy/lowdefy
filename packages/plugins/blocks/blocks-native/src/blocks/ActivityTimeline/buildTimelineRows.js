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

import describeEvent from './describeEvent.js';
import describeGap from './describeGap.js';
import getActor from './getActor.js';
import isThreadShown from './isThreadShown.js';
import summariseEvents from './summariseEvents.js';
import toTime from './toTime.js';

const actorKey = (by) => `${by?.id ?? by?.name ?? ''}|${by?.agent === true}`;

// The gaps of the `gaps` list among the entries, by time: a gap with `after` goes after the
// entries at or before that time, one with only `before` goes before the entries from that time.
function placeGaps({ entries, gaps }) {
  const items = [...entries];
  (gaps ?? [])
    .filter((gap) => type.isObject(gap) && gap.count > 0)
    .forEach((gap) => {
      const after = toTime(gap.after);
      const before = toTime(gap.before);
      let index = items.length;
      if (after !== null) {
        const next = items.findIndex((item) => item.type !== 'gap' && toTime(item.at) > after);
        index = next < 0 ? items.length : next;
      } else if (before !== null) {
        const next = items.findIndex((item) => item.type !== 'gap' && toTime(item.at) >= before);
        index = next < 0 ? items.length : next;
      }
      items.splice(index, 0, { ...gap, type: 'gap' });
    });
  return items;
}

/**
 * The rows the timeline draws, oldest first:
 *
 * - `{ type: 'earlier', id, before }`: "Show earlier activity", while `earlier` is true.
 * - `{ type: 'event', id, entry, line }`: an event on its own line.
 * - `{ type: 'group', id, at, actor, summary, line, events }`: two or more detail events in a
 *   row by one actor, folded into one line that opens to show each.
 * - `{ type: 'gap', id, gap, segments }`: events not loaded, as a count.
 * - `{ type: 'thread', id, thread }`: a comment and its replies.
 * - `{ type: 'resolved', id, thread }`: a resolved thread, folded to one line.
 *
 * Entries keep the order given. A deleted first comment shows only while its thread has replies.
 *
 * @param {Object} params
 * @param {Object[]} params.entries Events, comments and gaps (`type: 'gap'`).
 * @param {Object[]} [params.gaps] More gaps, placed among the entries by `after` and `before`.
 * @param {boolean} [params.earlier]
 * @param {boolean} [params.foldDetail] Fold detail events by actor; default true.
 * @param {Object} [params.formatEvent]
 * @param {Array} [params.members]
 * @returns {Object[]}
 */
function buildTimelineRows({ entries, gaps, earlier, foldDetail = true, formatEvent, members }) {
  const items = placeGaps({
    entries: (entries ?? []).filter((entry) => type.isObject(entry)),
    gaps,
  });
  const rows = [];
  if (earlier === true) {
    const oldest = items.find((item) => item.type !== 'gap');
    rows.push({ type: 'earlier', id: 'earlier', before: oldest?.at ?? null });
  }

  let run = [];
  const flush = () => {
    let start = 0;
    while (start < run.length) {
      let end = start + 1;
      while (end < run.length && actorKey(run[end].by) === actorKey(run[start].by)) {
        end += 1;
      }
      const events = run.slice(start, end);
      if (events.length === 1) {
        const [entry] = events;
        rows.push({
          type: 'event',
          id: entry.id,
          entry,
          line: describeEvent({ entry, formatEvent, members }),
        });
      } else {
        const actor = getActor({ by: events[0].by, members });
        const summary = summariseEvents({ entries: events, formatEvent });
        const first = describeEvent({ entry: events[0], formatEvent, members });
        rows.push({
          type: 'group',
          id: `group:${events[0].id}`,
          at: events[events.length - 1].at,
          actor,
          summary,
          line: {
            icon: first.icon,
            tone: first.tone,
            segments: [actor, { kind: 'text', text: ` ${summary}` }],
          },
          events: events.map((entry) => ({
            id: entry.id,
            entry,
            line: describeEvent({ entry, formatEvent, members }),
          })),
        });
      }
      start = end;
    }
    run = [];
  };

  items.forEach((item, index) => {
    if (item.type === 'gap') {
      flush();
      rows.push({
        type: 'gap',
        id: `gap:${item.id ?? item.after ?? ''}:${item.before ?? ''}:${index}`,
        gap: item,
        segments: describeGap({ gap: item, members }),
      });
      return;
    }
    if (item.type === 'comment') {
      flush();
      if (!isThreadShown(item)) {
        return;
      }
      rows.push({ type: item.resolved ? 'resolved' : 'thread', id: item.id, thread: item });
      return;
    }
    if (foldDetail && item.tier === 'detail') {
      run.push(item);
      return;
    }
    flush();
    rows.push({
      type: 'event',
      id: item.id,
      entry: item,
      line: describeEvent({ entry: item, formatEvent, members }),
    });
  });
  flush();
  return rows;
}

export default buildTimelineRows;
