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

const UPDATE_MS = 100;
// In g: a phone at rest reads about 1.
const SHAKE_FORCE = 1.8;
const JOLTS = 3;
const WINDOW_MS = 800;
const QUIET_MS = 1500;

/**
 * Calls onShake when the phone is shaken: 3 jolts over 1.8 g within 0.8 s, then not again for 1.5 s.
 * Returns the function that stops listening.
 *
 * @param {Object} params
 * @param {Object} params.accelerometer expo-sensors' Accelerometer.
 * @param {() => void} params.onShake
 * @param {() => number} [params.now]
 */
function watchShake({ accelerometer, now = Date.now, onShake }) {
  let jolts = [];
  let quietUntil = 0;
  accelerometer.setUpdateInterval(UPDATE_MS);
  const subscription = accelerometer.addListener(({ x, y, z }) => {
    const time = now();
    if (time < quietUntil || Math.sqrt(x * x + y * y + z * z) < SHAKE_FORCE) {
      return;
    }
    jolts = [...jolts.filter((at) => time - at <= WINDOW_MS), time];
    if (jolts.length >= JOLTS) {
      jolts = [];
      quietUntil = time + QUIET_MS;
      onShake();
    }
  });
  return () => subscription.remove();
}

export default watchShake;
