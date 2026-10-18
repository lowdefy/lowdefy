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

/**
 * The BottomSheet props that give a Sheet its detents. On iOS, no snap points give the system
 * medium and large detents; a single detent is a fraction of the large height. Android's sheet
 * has a half-height and a full-height state, which two snap points turn on, and opens a single
 * detent at full height.
 *
 * @param {Object} params
 * @param {'both'|'medium'|'large'} [params.detents] Defaults to both.
 * @param {string} params.platform Platform.OS.
 * @returns {{ snapPoints: (string[]|undefined), resizable: boolean }} resizable is whether the
 *   sheet moves between detents, so it shows the drag indicator.
 */
function getSheetDetents({ detents = 'both', platform }) {
  if (detents === 'medium') {
    return { snapPoints: ['50%'], resizable: false };
  }
  if (detents === 'large') {
    return { snapPoints: ['100%'], resizable: false };
  }
  return { snapPoints: platform === 'ios' ? undefined : ['50%', '100%'], resizable: true };
}

export default getSheetDetents;
