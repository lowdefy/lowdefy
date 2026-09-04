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

import clusterSessions from './clusterSessions.js';
import normaliseTrace from './normaliseTrace.js';
import sessionSequence from './sessionSequence.js';
import { traceJsonl } from './testTrace.js';

function sessions() {
  return normaliseTrace({ trace: traceJsonl }).sessions;
}

test('sessionSequence drops mount-class events and collapses runs of the same block event', () => {
  const [sessionA] = sessions();
  expect(sessionSequence({ session: sessionA })).toEqual([
    { block_id: 'search', event_name: 'onChange', page_id: 'orders' },
    { block_id: 'qty', event_name: 'onChange', page_id: 'orders' },
    { block_id: 'search', event_name: 'onEnter', page_id: 'orders' },
    { block_id: 'search', event_name: 'onKeyDown', page_id: 'orders' },
    { block_id: 'widget', event_name: 'onWidgetReady', page_id: 'orders' },
    { block_id: 'submit', event_name: 'onClick', page_id: 'orders' },
  ]);
});

test('sessionSequence starts a new run when the same block event returns after the window', () => {
  const session = {
    events: [
      { block_id: 'a', event_name: 'onChange', page_id: 'p', t: '2026-01-01T00:00:00.000Z' },
      { block_id: 'a', event_name: 'onChange', page_id: 'p', t: '2026-01-01T00:00:01.000Z' },
      { block_id: 'a', event_name: 'onChange', page_id: 'p', t: '2026-01-01T00:00:30.000Z' },
    ],
  };
  expect(sessionSequence({ session })).toHaveLength(2);
});

test('clusterSessions groups the two sessions that drove the same sequence', () => {
  const groups = clusterSessions({ sessions: sessions() });
  expect(groups).toHaveLength(2);
  expect(groups[0].sessionCount).toBe(2);
  expect(groups[0].sessions.map((session) => session.session_id)).toEqual(['s-b', 's-c']);
  expect(groups[1].sessionCount).toBe(1);
});

test('clusterSessions counts failures and compiles the group from a failing session', () => {
  const [group] = clusterSessions({ sessions: sessions() });
  expect(group.failures).toBe(1);
  expect(group.representative.session_id).toBe('s-b');
  expect(group.first_seen).toBe('2026-09-01T11:00:00.000Z');
  expect(group.last_seen).toBe('2026-09-02T09:00:02.000Z');
  expect(group.sample_rids).toEqual(['rid-b', 'rid-c']);
});

test('clusterSessions ranks by sessions and by failures', () => {
  const groups = clusterSessions({ sessions: sessions() });
  expect(groups.map((group) => group.rank)).toEqual([
    { by_failures: 1, by_sessions: 1 },
    { by_failures: 2, by_sessions: 2 },
  ]);
});

test('clusterSessions leaves out a session whose events are all mount-class', () => {
  const session = {
    events: [
      { block_id: 'page', event_name: 'onMount', page_id: 'p', t: '2026-01-01T00:00:00.000Z' },
    ],
    page_id: 'p',
  };
  expect(clusterSessions({ sessions: [session] })).toEqual([]);
});
