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

const defaultPanelWidth = { minWidth: 240, maxWidth: 480, initialWidth: 300 };

function getPanelLimits(panel) {
  return {
    minWidth: panel?.minWidth ?? defaultPanelWidth.minWidth,
    maxWidth: panel?.maxWidth ?? defaultPanelWidth.maxWidth,
    initialWidth: panel?.initialWidth ?? defaultPanelWidth.initialWidth,
  };
}

// A width held to the range; anything that is not a finite number gives the initial width.
function clampPanelWidth({ width, minWidth, maxWidth, initialWidth }) {
  if (typeof width !== 'number' || !Number.isFinite(width)) {
    return Math.round(Math.min(maxWidth, Math.max(minWidth, initialWidth)));
  }
  return Math.round(Math.min(maxWidth, Math.max(minWidth, width)));
}

export { clampPanelWidth, getPanelLimits };
