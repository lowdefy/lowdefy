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
// Module-level ring buffer of recent server-side errors (request, endpoint, MCP
// and agent tool failures) — feeds the getBuildStatus feedback endpoint so
// agents can see server errors, with their config source, without tailing
// server logs. Deliberately in-memory only: entries are lost on server
// restart, which is fine since this is a live-session debugging aid.
const MAX_ENTRIES = 50;

const entries = [];

function push(entry) {
  entries.push(entry);
  if (entries.length > MAX_ENTRIES) {
    entries.shift();
  }
}

function list() {
  return [...entries];
}

export default { push, list };
