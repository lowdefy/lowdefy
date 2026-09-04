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

import journeySessionKey from './journeySessionKey.js';

// Every API call the app makes carries the tab's journey session id, so a
// request_completed or step_completed line can be tied to the session that
// caused it. The tab has a session id whether or not the recorder sampled it
// - an unsampled session sends no journey_event lines, but a feedback report
// from that tab still turns its server lines into a trace.
//
// The value is the id the tab minted (a uuid) and the server validates it
// before it reaches a log line; a tab that has no session, or a browser that
// blocks site data, simply sends no header.
function getJourneySessionHeaders({ window }) {
  if (type.isNone(window?.sessionStorage)) {
    return {};
  }
  let sessionId = null;
  try {
    sessionId = JSON.parse(window.sessionStorage.getItem(journeySessionKey))?.session_id ?? null;
  } catch {
    return {};
  }
  if (!type.isString(sessionId) || sessionId === '') {
    return {};
  }
  return { 'x-lowdefy-session': sessionId };
}

export default getJourneySessionHeaders;
