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

import { isTraceId, type } from '@lowdefy/helpers';

import { JOURNEY_COOKIES, readJourneyCookie } from '../journeyCookies.js';

const RUN_SOURCES = ['journey'];

function parsePayload(payload) {
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
}

// What the recording cookie on a request says: 'off' (a headless tool context
// that must not record), { source, run } (a headless journey run),
// or null (no verified cookie - a developer's own tab, which records as dev).
// A run that records nothing (a journey run its caller does not record) also
// carries record: false: its errors are attributed to it, but the recorder
// stays off.
// Only the dev server's own headless browser can write a verified cookie, so a
// page can never relabel what it records.
function readRecordingCookie(cookieHeader) {
  const payload = readJourneyCookie({ cookieHeader, name: JOURNEY_COOKIES.recording.name });
  if (payload === null) {
    return null;
  }
  if (payload === 'off') {
    return 'off';
  }
  const parsed = parsePayload(payload);
  if (
    !type.isObject(parsed) ||
    !RUN_SOURCES.includes(parsed.source) ||
    !type.isObject(parsed.run) ||
    !isTraceId(parsed.run.id)
  ) {
    return null;
  }
  const recording = {
    source: parsed.source,
    run: {
      id: parsed.run.id,
      by: parsed.run.by ?? null,
      journey: parsed.run.journey ?? null,
      actor: parsed.run.actor ?? null,
    },
  };
  if (parsed.record === false) {
    recording.record = false;
  }
  return recording;
}

export default readRecordingCookie;
