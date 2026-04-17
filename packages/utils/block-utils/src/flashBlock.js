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

const FLASH_KEYFRAMES = [
  {
    boxShadow: '0 0 0 0 rgba(24, 144, 255, 0)',
    backgroundColor: 'rgba(24, 144, 255, 0)',
  },
  {
    boxShadow: '0 0 0 8px rgba(24, 144, 255, 0.35)',
    backgroundColor: 'rgba(24, 144, 255, 0.10)',
    offset: 0.3,
  },
  {
    boxShadow: '0 0 0 0 rgba(24, 144, 255, 0)',
    backgroundColor: 'rgba(24, 144, 255, 0)',
  },
];

const FLASH_TIMING = { duration: 1100, easing: 'ease-out' };

function flashBlock(blockId) {
  if (typeof document === 'undefined') return;
  const el = document.getElementById(`bl-${blockId}`);
  if (!el || typeof el.animate !== 'function') return;
  el.animate(FLASH_KEYFRAMES, FLASH_TIMING);
}

export default flashBlock;
