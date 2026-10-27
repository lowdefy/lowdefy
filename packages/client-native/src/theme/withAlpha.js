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

const hexPattern = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

function expandHex(digits) {
  if (digits.length === 3) {
    return digits
      .split('')
      .map((digit) => digit + digit)
      .join('');
  }
  return digits.slice(0, 6);
}

/**
 * A colour at an opacity, for the tinted fills drawn from a token: a tinted button, a tag or a
 * callout behind text of the same colour. antd's computed colour tokens are hex; any other colour
 * is a CSS colour React Native reads as written, so it is returned unchanged.
 *
 * @param {Object} params
 * @param {string} params.color A hex colour (#rgb, #rrggbb or #rrggbbaa).
 * @param {number} params.alpha The opacity, 0 to 1.
 * @returns {string} An `rgba()` colour, or `color` when it is not hex.
 */
function withAlpha({ alpha, color }) {
  const match = hexPattern.exec(color ?? '');
  if (match === null) {
    return color;
  }
  const hex = expandHex(match[1]);
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  return `rgba(${red},${green},${blue},${alpha})`;
}

export default withAlpha;
