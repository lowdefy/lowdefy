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

function toByte(linear) {
  const encoded = linear <= 0.0031308 ? 12.92 * linear : 1.055 * Math.pow(linear, 1 / 2.4) - 0.055;
  const clamped = Math.min(1, Math.max(0, encoded));
  return Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0');
}

function parseChannel(value) {
  if (value.endsWith('%')) {
    return Number(value.slice(0, -1)) / 100;
  }
  return Number(value);
}

// Tailwind 4's palette is written in oklch(), which React Native cannot read,
// so the mobile build converts it to sRGB hex (OKLab to linear sRGB, then the
// sRGB transfer curve, clamped to the gamut). Returns the value unchanged when
// it is not an oklch() colour.
function oklchToHex(value) {
  const match = String(value)
    .trim()
    .match(/^oklch\(\s*([\d.]+%?)\s+([\d.]+%?)\s+([\d.]+)(?:deg)?\s*(?:\/\s*([\d.]+%?))?\s*\)$/i);
  if (!match) {
    return value;
  }
  const lightness = parseChannel(match[1]);
  const chroma = match[2].endsWith('%') ? parseChannel(match[2]) * 0.4 : Number(match[2]);
  const hue = (Number(match[3]) * Math.PI) / 180;
  const a = chroma * Math.cos(hue);
  const b = chroma * Math.sin(hue);
  const l = Math.pow(lightness + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(lightness - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(lightness - 0.0894841775 * a - 1.291485548 * b, 3);
  const red = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const green = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const blue = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  const hex = `#${toByte(red)}${toByte(green)}${toByte(blue)}`;
  if (match[4] === undefined) {
    return hex;
  }
  const alpha = Math.round(Math.min(1, Math.max(0, parseChannel(match[4]))) * 255)
    .toString(16)
    .padStart(2, '0');
  return alpha === 'ff' ? hex : `${hex}${alpha}`;
}

export default oklchToHex;
