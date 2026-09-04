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

const MOUNT_EVENT_PATTERN = /^on(Init|Mount)/;

// onInit, onInitAsync, onMount and onMountAsync fire by themselves when a page
// opens, so every session on a page shares them. They carry no information
// about what the user did, which makes them noise in the sequence hash and in
// the coverage denominator - a journey verb cannot exercise them either way.
function isMountEvent({ event }) {
  return MOUNT_EVENT_PATTERN.test(event.event_name);
}

export default isMountEvent;
