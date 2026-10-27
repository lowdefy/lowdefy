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

function round(value) {
  return Math.round(value * 1000) / 1000;
}

/**
 * The svg path of a pie slice that fills `fraction` of a circle clockwise from twelve o'clock,
 * as Linear's progress glyphs fill.
 *
 * @param {Object} params
 * @param {number} params.cx
 * @param {number} params.cy
 * @param {number} params.fraction From 0 to 1.
 * @param {number} params.r
 * @returns {string} The path's `d`; empty for nothing filled.
 */
function getPiePath({ cx, cy, fraction, r }) {
  if (fraction <= 0) {
    return '';
  }
  if (fraction >= 1) {
    return `M${cx} ${cy - r}A${r} ${r} 0 1 1 ${cx} ${cy + r}A${r} ${r} 0 1 1 ${cx} ${cy - r}Z`;
  }
  const angle = fraction * 2 * Math.PI;
  const x = round(cx + r * Math.sin(angle));
  const y = round(cy - r * Math.cos(angle));
  const largeArc = fraction > 0.5 ? 1 : 0;
  return `M${cx} ${cy}L${cx} ${cy - r}A${r} ${r} 0 ${largeArc} 1 ${x} ${y}Z`;
}

export default getPiePath;
