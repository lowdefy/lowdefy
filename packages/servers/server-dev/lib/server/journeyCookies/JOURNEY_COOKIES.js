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

// Every cookie the dev server's own headless browser sets on a journey
// context. Each value is "<journeyActorToken>.<payload>", so only that browser
// can set one: a cookie from anywhere else fails verification and is ignored.
// The production server never reads any of them.
//
// kind: an inline cookie carries its whole meaning in the payload (an actor's
// client address); a registry cookie carries the id of an entry the dev server
// keeps in memory for the length of one journey run.
//
// loopback: a detached CallApi loops back through /api/detached/* as a fresh
// request, so a cookie whose state must reach that request (the data set, the
// mutant) is forwarded on it - see forwardJourneyCookies. The actor and
// recording cookies describe the browser, not the work, and stay behind.
const JOURNEY_COOKIES = {
  actor: { name: 'lowdefy_journey_actor', kind: 'inline', loopback: false },
  recording: { name: 'lowdefy_recording', kind: 'inline', loopback: false },
  data: { name: 'lowdefy_journey_data', kind: 'registry', loopback: true },
  mutant: { name: 'lowdefy_journey_mutant', kind: 'registry', loopback: true },
};

export default JOURNEY_COOKIES;
