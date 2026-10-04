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

const { default: readRecordingCookie } = await import('./readRecordingCookie.js');
const { default: recordingCookiePayload } = await import('./recordingCookiePayload.js');
const { default: isRecordingEnabled } = await import('./isRecordingEnabled.js');
const { JOURNEY_COOKIES, writeJourneyCookie } = await import('../journeyCookies.js');

const origin = 'http://localhost:3001';

function cookieFor(payload) {
  const cookie = writeJourneyCookie({ name: JOURNEY_COOKIES.recording.name, payload, origin });
  return `other=1; ${cookie.name}=${cookie.value}`;
}

afterEach(() => {
  delete process.env.LOWDEFY_DEV_RECORD;
});

test('readRecordingCookie returns null with no cookie or a forged one', () => {
  expect(readRecordingCookie(undefined)).toBe(null);
  expect(readRecordingCookie('lowdefy_recording=nope.off')).toBe(null);
});

test('readRecordingCookie reads off and a run payload', () => {
  expect(readRecordingCookie(cookieFor('off'))).toBe('off');
  const recording = {
    source: 'explorer',
    run: { id: '20261003T160000Z-77abcd', by: 'explorer', journey: 'walk-1', actor: 'main' },
  };
  expect(readRecordingCookie(cookieFor(recordingCookiePayload({ recording })))).toEqual(recording);
});

test('readRecordingCookie keeps record: false on a run that records nothing, and isRecordingEnabled is false for it', () => {
  const recording = {
    source: 'explorer',
    run: { id: '20261003T160000Z-77abcd', by: 'explorer', journey: 'walk-1-confirm', actor: 'main' },
    record: false,
  };
  const cookie = cookieFor(recordingCookiePayload({ recording }));
  expect(readRecordingCookie(cookie)).toEqual(recording);
  expect(isRecordingEnabled(cookie)).toBe(false);
});

test('readRecordingCookie treats a verified payload with a bad source or run id as absent', () => {
  const badSource = recordingCookiePayload({
    recording: { source: 'production', run: { id: '20261003T160000Z-77abcd' } },
  });
  const badRun = recordingCookiePayload({ recording: { source: 'journey', run: { id: '../x' } } });
  expect(readRecordingCookie(cookieFor(badSource))).toBe(null);
  expect(readRecordingCookie(cookieFor(badRun))).toBe(null);
  expect(readRecordingCookie(cookieFor('%%%'))).toBe(null);
});

test('isRecordingEnabled is false for the env switch and for an off cookie, else true', () => {
  expect(isRecordingEnabled(undefined)).toBe(true);
  expect(isRecordingEnabled(cookieFor('off'))).toBe(false);
  process.env.LOWDEFY_DEV_RECORD = 'false';
  expect(isRecordingEnabled(undefined)).toBe(false);
});
