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

function take(list, { since, until }) {
  const taken = list.filter((event) => event.time >= since && event.time <= until);
  const kept = list.filter((event) => event.time > until);
  list.splice(0, list.length, ...kept);
  return taken;
}

// Removes and returns the page errors, app requests and app responses a
// journey's contexts buffered in [since, until] (milliseconds), dropping older
// ones: what one step's window produced.
function takeJourneyEvents({ events, since, until }) {
  return {
    pageErrors: take(events.pageErrors, { since, until }),
    requests: take(events.requests, { since, until }),
    responses: take(events.responses, { since, until }),
  };
}

export default takeJourneyEvents;
