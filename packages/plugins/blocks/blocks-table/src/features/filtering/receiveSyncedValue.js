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

function serialize(value) {
  return JSON.stringify(value ?? null);
}

// How useSyncedState takes a newly committed value, given the writes it sent that have not
// committed yet (`inFlight`, oldest first). A write can be sent before the one before it
// commits, so the committed value may be any in-flight write, not only the latest: that is the
// editor's own edit catching up, not a change from outside. A value matching no in-flight write
// is `external` and replaces the editor's state. Once the latest write commits, or an external
// value replaces the editor's state, nothing is in flight.
function receiveSyncedValue({ inFlight, value }) {
  const sent = inFlight.map(serialize);
  const received = serialize(value);
  if (sent.at(-1) === received) return { external: false, inFlight: [] };
  if (sent.includes(received)) return { external: false, inFlight };
  return { external: true, inFlight: [] };
}

export default receiveSyncedValue;
