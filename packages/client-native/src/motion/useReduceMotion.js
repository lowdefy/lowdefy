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

import { useSyncExternalStore } from 'react';
import { AccessibilityInfo } from 'react-native';

import createReduceMotionStore from './createReduceMotionStore.js';

const store = createReduceMotionStore({ AccessibilityInfo });

/**
 * Whether the person has turned on Reduce Motion: animations that move things (a shimmer, a
 * fade) are drawn in their final state instead.
 *
 * @returns {boolean}
 */
function useReduceMotion() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot);
}

export default useReduceMotion;
