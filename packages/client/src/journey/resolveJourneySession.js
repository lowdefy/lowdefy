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

import journeySessionKey from './journeySessionKey.js';

function createSessionId(window) {
  if (typeof window.crypto?.randomUUID === 'function') {
    return window.crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

// One session id per tab, and one sampling verdict taken with it: sampling per
// session rather than per event is what makes a kept session a complete story
// instead of a scatter of unrelated clicks. sessionStorage is the per-tab
// store and can throw outright (a browser configured to block site data), in
// which case the tab records under an unremembered session.
function resolveJourneySession({ sampleRate, window }) {
  let stored = null;
  try {
    stored = JSON.parse(window.sessionStorage.getItem(journeySessionKey));
  } catch {
    stored = null;
  }
  if (stored?.session_id) {
    return { sampled: stored.sampled === true, sessionId: stored.session_id };
  }
  const session = { sampled: Math.random() < sampleRate, session_id: createSessionId(window) };
  try {
    window.sessionStorage.setItem(journeySessionKey, JSON.stringify(session));
  } catch {
    // Nothing to do: an unstorable session is still a valid session.
  }
  return { sampled: session.sampled, sessionId: session.session_id };
}

export default resolveJourneySession;
