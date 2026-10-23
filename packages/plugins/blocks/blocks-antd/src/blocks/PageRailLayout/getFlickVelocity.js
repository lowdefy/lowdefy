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

// Only the pointer's last moves count towards a flick: a finger that dragged slowly and then
// flicked is fast, and one that dragged fast and then stopped is not.
const VELOCITY_WINDOW = 100;

// Pixels per millisecond over the samples ({ offset, t }) in the window before `now`.
function getFlickVelocity({ samples, now }) {
  const recent = samples.filter((sample) => now - sample.t <= VELOCITY_WINDOW);
  if (recent.length < 2) return 0;
  const first = recent[0];
  const last = recent[recent.length - 1];
  return (last.offset - first.offset) / Math.max(1, last.t - first.t);
}

export { VELOCITY_WINDOW };
export default getFlickVelocity;
