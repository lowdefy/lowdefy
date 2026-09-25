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

// Bumped when a hub method changes shape. A client that needs a newer protocol
// than the running hub speaks asks it to hand over (see connectHub).
const HUB_PROTOCOL = 1;

// Managed dev servers get a public/internal port pair from this range, clear
// of 3000 (the conventional human dev server) and the 3xxx ports people pick
// by hand.
const PORT_RANGE = { first: 4100, last: 4999 };

// A hub-owned server nobody is attached to, with no browser tab open, stops
// after this long.
const IDLE_STOP_MS = 30 * 60 * 1000;

// The hub exits after this long with no managed servers and no clients.
const HUB_IDLE_EXIT_MS = 10 * 60 * 1000;

const READY_TIMEOUT_MS = 120 * 1000;

export { HUB_IDLE_EXIT_MS, HUB_PROTOCOL, IDLE_STOP_MS, PORT_RANGE, READY_TIMEOUT_MS };
