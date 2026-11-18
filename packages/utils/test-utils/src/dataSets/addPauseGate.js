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

// Sets a pause gate on a data session, for a test of two calls that race. The next routine to
// reach a matching request stops just before the request runs (holdAtPauseGate). Returns
// { reached, release }: `reached` resolves once a routine is held there, and release() lets it
// go on. One gate holds one routine; a second routine reaching the request runs straight
// through. The gate stays on the session with `reached` recorded until releasePauseGates
// clears them; one released before any routine reached it holds nothing later.
function addPauseGate({ endpoint, pageId, requestId, session }) {
  const gate = { requestId, endpoint, pageId, reached: false, released: false };
  gate.arrived = new Promise((resolve) => {
    gate.arrive = resolve;
  });
  gate.whenReleased = new Promise((resolve) => {
    gate.release = () => {
      gate.released = true;
      resolve();
    };
  });
  session.pauseGates.push(gate);
  return { reached: gate.arrived, release: gate.release };
}

export default addPauseGate;
