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

import { type } from '@lowdefy/helpers';

// Each stop is a color followed by its position, eg. "rgb(22,119,255) 0%" or "#1677ff 100%".
const gradientStop =
  /(rgba?\([^)]*\)|hsla?\([^)]*\)|hsva?\([^)]*\)|hsba?\([^)]*\)|#[0-9a-f]{3,8}|[a-z]+)\s+(-?\d+(?:\.\d+)?)%/gi;

// antd reads a gradient as a list of color stops, not as CSS, so the linear-gradient string the
// block stores for a gradient is turned back into its stops. An empty string shows the picker as
// cleared, which is what a null value means.
function toPickerColor(value) {
  if (type.isNone(value)) return '';
  if (!type.isString(value) || !value.startsWith('linear-gradient(')) return value;
  const stops = [...value.matchAll(gradientStop)].map((match) => ({
    color: match[1],
    percent: Number(match[2]),
  }));
  if (stops.length === 0) {
    throw new Error(
      `ColorSelector value is not a linear gradient. Received ${JSON.stringify(value)}.`
    );
  }
  return stops;
}

export default toPickerColor;
