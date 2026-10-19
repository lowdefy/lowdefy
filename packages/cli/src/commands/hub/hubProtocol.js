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

// Bumped when the hub gains methods a client needs. Several lowdefy versions
// share one hub, so a bump only adds: a hub keeps serving every earlier
// protocol's methods unchanged, and connectHub accepts a hub at its own
// protocol or newer. A client that finds an older hub tells the user to stop
// it, and the next hub adopts its servers.
const HUB_PROTOCOL = 1;

// Managed dev servers get a public/internal port pair from this range, clear
// of 3000 (the conventional human dev server) and the 3xxx ports people pick
// by hand.
const PORT_RANGE = { first: 4100, last: 4999 };

// A hub-owned server nobody has used for this long, with no browser tab
// open, stops. Shorter as the machine runs short of memory.
const IDLE_LIMIT_MS = {
  normal: 15 * 60 * 1000,
  warn: 5 * 60 * 1000,
  critical: 2 * 60 * 1000,
};

// Only for a server on an older server-dev, whose instance record does not
// say when it was last used: it stops this long after the last agent session
// attached to it detached, with no browser tab open.
const IDLE_STOP_MS = 30 * 60 * 1000;

// Under memory pressure, a start that would take the hub to more running
// servers than this first stops the idle ones, rather than waiting for the
// next reap pass. Never a cap: nothing is refused or stopped on the count.
const SOFT_CAP_SERVERS = 4;

// The hub exits after this long with no managed servers and no clients.
const HUB_IDLE_EXIT_MS = 10 * 60 * 1000;

const READY_TIMEOUT_MS = 120 * 1000;

// At most this many dev servers launch at once across the machine (one at
// critical memory pressure); the rest queue. A slot is held until the server
// is ready, gone, or START_SLOT_HOLD_MS has passed.
const START_SLOTS = 2;
const START_SLOT_HOLD_MS = 5 * 60 * 1000;

// The most dev server log lines a logs call returns.
const MAX_LOG_LINES = 1000;

export {
  HUB_IDLE_EXIT_MS,
  HUB_PROTOCOL,
  IDLE_LIMIT_MS,
  IDLE_STOP_MS,
  MAX_LOG_LINES,
  PORT_RANGE,
  READY_TIMEOUT_MS,
  SOFT_CAP_SERVERS,
  START_SLOT_HOLD_MS,
  START_SLOTS,
};
