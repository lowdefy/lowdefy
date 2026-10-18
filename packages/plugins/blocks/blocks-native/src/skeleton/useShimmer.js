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

import { useEffect } from 'react';

import shimmerClock from './shimmerClock.js';

/**
 * The shared shimmer progress (shimmerClock), held while the component is mounted and `enabled`.
 * Every shape reads the same value, so a screen of skeletons sweeps as one.
 *
 * @param {Object} params
 * @param {boolean} params.enabled False with Reduce Motion on: the clock is not held.
 * @returns {Animated.Value}
 */
function useShimmer({ enabled }) {
  useEffect(() => {
    if (!enabled) return undefined;
    shimmerClock.acquire();
    return () => shimmerClock.release();
  }, [enabled]);
  return shimmerClock.progress;
}

export default useShimmer;
