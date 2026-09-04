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

import { jest } from '@jest/globals';

import createJourneySender from './createJourneySender.js';

function testWindow({ beacon }) {
  return {
    Blob: class Blob {
      constructor(parts) {
        this.parts = parts;
      }
    },
    fetch: jest.fn(() => Promise.resolve()),
    navigator: { sendBeacon: jest.fn(() => beacon) },
  };
}

test('createJourneySender posts the batch with sendBeacon', () => {
  const window = testWindow({ beacon: true });
  createJourneySender({ url: '/api/journey', window })([{ block_id: 'b' }]);

  expect(window.navigator.sendBeacon).toHaveBeenCalledTimes(1);
  expect(window.navigator.sendBeacon.mock.calls[0][0]).toBe('/api/journey');
  expect(window.fetch).not.toHaveBeenCalled();
});

test('createJourneySender falls back to a keepalive fetch when sendBeacon refuses the body', () => {
  const window = testWindow({ beacon: false });
  createJourneySender({ url: '/api/journey', window })([{ block_id: 'b' }]);

  expect(window.fetch).toHaveBeenCalledTimes(1);
  const [url, options] = window.fetch.mock.calls[0];
  expect(url).toBe('/api/journey');
  expect(options.keepalive).toBe(true);
  expect(options.credentials).toBe('same-origin');
  expect(JSON.parse(options.body)).toEqual({ events: [{ block_id: 'b' }] });
});
