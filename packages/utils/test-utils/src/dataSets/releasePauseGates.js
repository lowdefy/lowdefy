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

// Lets go of every routine a data session's pause gates hold and removes every gate, reached or
// not, so a test that failed between setting a gate and releasing it leaves nothing held for
// the next one.
function releasePauseGates({ session }) {
  session.pauseGates.forEach((gate) => gate.release());
  session.pauseGates.length = 0;
}

export default releasePauseGates;
