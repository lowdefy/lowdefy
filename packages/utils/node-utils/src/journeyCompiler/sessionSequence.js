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

import isMountEvent from './isMountEvent.js';
import sessionEvents from './sessionEvents.js';

// The identity of a session: the (page, block, event) triples the user drove,
// with mount-class events out and keystroke storms collapsed. Two sessions with
// the same sequence are the same journey done twice.
function sessionSequence({ session }) {
  return sessionEvents({ session })
    .filter((event) => !isMountEvent({ event }))
    .map((event) => ({
      block_id: event.block_id,
      event_name: event.event_name,
      page_id: event.page_id,
    }));
}

export default sessionSequence;
