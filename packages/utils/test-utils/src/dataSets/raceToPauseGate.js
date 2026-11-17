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

// Races what start() sets going, a promise of what a routine answers, against the pause gates
// open on the session just before it starts (set, and neither reached nor released): a routine
// takes its gate synchronously, so they are read first. Resolves { value } when the work settles
// first, or { gate, work } with the gate a routine reached first: that routine is held there, and
// `work` settles once the gate is released, for the caller to await then. A rejection of the work
// before any gate is reached rejects. A journey runs one call at a time, so the routine that
// reaches a gate while the work runs is the work's own.
function raceToPauseGate({ session, start }) {
  const open = session.pauseGates.filter((gate) => !gate.reached && !gate.released);
  const work = start();
  return Promise.race([
    work.then((value) => ({ value })),
    ...open.map((gate) => gate.arrived.then(() => ({ gate, work }))),
  ]);
}

export default raceToPauseGate;
