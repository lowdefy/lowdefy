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

// iOS control metrics: 44 points is the smallest comfortable touch target, so the default size
// is 44 tall in the body text size; small is a compact 34 in subheadline, large 50.
const SIZES = {
  small: { borderRadius: 8, fontSize: 15, height: 34, paddingHorizontal: 10 },
  default: { borderRadius: 10, fontSize: 17, height: 44, paddingHorizontal: 12 },
  large: { borderRadius: 12, fontSize: 17, height: 50, paddingHorizontal: 16 },
};

/**
 * The height, font size, corner radius and horizontal padding of an input or button for its
 * `size`, at iOS control metrics.
 *
 * @param {Object} params
 * @param {string} [params.size] 'small', 'default' or 'middle' (the same), or 'large'.
 * @returns {{ borderRadius: number, fontSize: number, height: number, paddingHorizontal: number }}
 */
function getControlSize({ size }) {
  if (size === 'small' || size === 'large') {
    return SIZES[size];
  }
  return SIZES.default;
}

export default getControlSize;
