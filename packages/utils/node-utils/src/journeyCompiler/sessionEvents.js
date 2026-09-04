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

import collapseEventRuns from './collapseEventRuns.js';

// The events a session contributes, and the one reading of them the whole
// compiler shares - so a candidate's file name and its steps can never
// disagree about where the session ended.
//
// Truncation comes before the run collapse: a failure ends the journey, and a
// run that reaches across the failure would otherwise carry a value the user
// typed after it back into a step before it.
function sessionEvents({ session }) {
  const failed = session.events.findIndex((event) => event.success === false);
  const events = failed === -1 ? session.events : session.events.slice(0, failed + 1);
  return collapseEventRuns({ events });
}

export default sessionEvents;
