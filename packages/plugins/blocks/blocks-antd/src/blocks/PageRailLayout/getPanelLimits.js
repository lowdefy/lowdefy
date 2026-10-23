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

// The initial width is held to the range too, so resetting the panel to it never leaves the panel
// wider or narrower than a drag could make it.
function getPanelLimits(panel) {
  const minWidth = panel?.minWidth ?? defaultPanelWidth.minWidth;
  const maxWidth = Math.max(minWidth, panel?.maxWidth ?? defaultPanelWidth.maxWidth);
  const initialWidth = panel?.initialWidth ?? defaultPanelWidth.initialWidth;
  return {
    minWidth,
    maxWidth,
    initialWidth: Math.min(maxWidth, Math.max(minWidth, initialWidth)),
  };
}

export default getPanelLimits;
