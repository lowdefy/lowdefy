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
  return Math.round(value * 10) / 10;
}

function toPath(stroke) {
  if (stroke.length === 1) {
    const [x, y] = stroke[0];
    return `M${round(x)} ${round(y)}l0.1 0`;
  }
  return stroke
    .map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${round(x)} ${round(y)}`)
    .join('');
}

/**
 * A signature's value: its strokes (lists of [x, y] points in the pad's points), the pad's size and
 * an SVG of it that a server can store, render or turn into a PNG. null for no strokes.
 *
 * @param {Object} params
 * @param {number[][][]} params.strokes
 * @param {number} params.width
 * @param {number} params.height
 * @param {string} params.color The ink colour.
 * @param {number} params.strokeWidth
 * @returns {{ svg: string, strokes: number[][][], width: number, height: number }|null}
 */
function toSignatureValue({ color, height, strokes, strokeWidth, width }) {
  if (strokes.length === 0) {
    return null;
  }
  const paths = strokes
    .map(
      (stroke) =>
        `<path d="${toPath(
          stroke
        )}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`
    )
    .join('');
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${round(width)}" height="${round(
      height
    )}" viewBox="0 0 ${round(width)} ${round(height)}">${paths}</svg>`,
    strokes: strokes.map((stroke) => stroke.map(([x, y]) => [round(x), round(y)])),
    width: round(width),
    height: round(height),
  };
}

export { toPath };
export default toSignatureValue;
