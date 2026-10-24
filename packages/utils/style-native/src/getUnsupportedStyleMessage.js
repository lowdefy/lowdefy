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

const supportedDisplays = new Set(['flex', 'none', 'contents']);
const unsupportedPositions = new Set(['fixed', 'sticky']);

// Why React Native cannot honour a style key, or null when it can. The build
// fails on these, and the shell reports them, so a web-only style never
// silently does nothing on a phone.
function getUnsupportedStyleMessage({ key, value }) {
  if (/^[:&@]/.test(key) || /[\s>]/.test(key)) {
    return `"${key}" is a selector or media query, which React Native styles do not have.`;
  }
  if (/^(transition|animation)/.test(key)) {
    return `"${key}" is web-only: React Native styles have no transitions or animations.`;
  }
  if (/^grid/.test(key)) {
    return `"${key}" is web-only: React Native has no CSS grid. Use layout or flex instead.`;
  }
  if (key === 'cursor') {
    return '"cursor" is web-only: phones have no mouse pointer.';
  }
  if (key === 'display' && typeof value === 'string' && !supportedDisplays.has(value.trim())) {
    return `"display: ${value}" is web-only: React Native views lay out with flex. Use "flex" or "none".`;
  }
  if (key === 'position' && typeof value === 'string' && unsupportedPositions.has(value.trim())) {
    return `"position: ${value}" is web-only: React Native supports "relative" and "absolute".`;
  }
  return null;
}

export default getUnsupportedStyleMessage;
