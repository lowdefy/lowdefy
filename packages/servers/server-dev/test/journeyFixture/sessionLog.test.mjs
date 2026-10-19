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

import { formatSessionLog, readRecordings } from '@lowdefy/node-utils';

import { fixtureTest, postJourney } from './fixtureClient.mjs';

// The recorder and the session log over the real fixture app: what a browser
// did, recorded as a test run records it, reads back as one line per
// interaction with the actions, requests, endpoints and state it caused.

function newRunId() {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d+Z$/, 'Z');
  return `${stamp}-sl0001`;
}

fixtureTest(
  'a recorded run reads back as a session log naming its request, endpoint and state',
  async () => {
    const run = newRunId();
    const result = await postJourney({
      pageId: 'home',
      recording: { run, journey: 'session-log' },
      steps: [
        { fill: { blockId: 'name_input', value: 'Logged item' } },
        { click: 'save_button' },
        { wait: { request: 'save_item' } },
        { click: 'notify_button' },
        { expect: { visible: 'notified_text' } },
      ],
    });
    expect(result.passed).toBe(true);

    const records = readRecordings({
      configDirectory: process.env.LOWDEFY_JOURNEY_FIXTURE_DIRECTORY,
      source: 'journey',
      run,
    });
    const notify = records.find(
      (record) => record.kind === 'click' && record.target?.block_id === 'notify_button'
    );
    expect(notify.event.actions).toEqual(['CallAPI', 'SetState']);
    expect(notify.event.endpoints).toEqual([{ id: 'notify', ok: true, ms: expect.any(Number) }]);

    const { lines } = formatSessionLog({
      records: records.filter((record) => record.session === notify.session),
    });
    expect(lines[0]).toBe('page home');
    expect(lines).toContain('fill name_input "Logged item"');
    expect(lines.find((line) => line.startsWith('click save_button'))).toContain(
      'request save_item ok'
    );
    expect(lines).toContain(
      'click notify_button "Notify" → ran SetState, endpoint notify ok, state notified = true'
    );
  }
);
