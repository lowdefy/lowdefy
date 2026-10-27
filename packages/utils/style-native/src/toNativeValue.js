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

const REM_PX = 16;
const cssFunctionPattern = /\b(calc|var|min|max|clamp|env)\(/;
const numberPattern = /^(-?(?:\d+\.?\d*|\.\d+))([a-z%]*)$/i;

// Converts one CSS value to its React Native form: px and rem lengths become
// numbers, unitless numeric strings become numbers, and anything React Native
// cannot express is an error. Returns { value } or { error }.
function toNativeValue({ key, value }) {
  if (typeof value === 'number') {
    if (key === 'lineHeight') {
      return {
        error: `Unitless "lineHeight: ${value}" is relative to the font size on the web, but React Native line heights are pixels. Use px or rem.`,
      };
    }
    if (key === 'fontWeight') {
      return { value: String(value) };
    }
    return { value };
  }
  if (typeof value !== 'string') {
    return { value };
  }
  const trimmed = value.trim();
  if (trimmed.includes('!important')) {
    return { error: `"${key}: ${value}" uses !important, which React Native styles do not have.` };
  }
  if (cssFunctionPattern.test(trimmed)) {
    return {
      error: `"${key}: ${value}" uses a CSS function (calc, var, min, max, clamp or env) that React Native cannot evaluate.`,
    };
  }
  const match = trimmed.match(numberPattern);
  if (!match) {
    return { value: trimmed };
  }
  const number = Number(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === 'px') {
    return { value: number };
  }
  if (unit === 'rem') {
    return { value: number * REM_PX };
  }
  if (unit === '%') {
    return { value: trimmed };
  }
  if (unit === '') {
    if (key === 'fontWeight') {
      return { value: trimmed };
    }
    if (key === 'lineHeight') {
      return {
        error: `Unitless "lineHeight: ${value}" is relative to the font size on the web, but React Native line heights are pixels. Use px or rem.`,
      };
    }
    return { value: number };
  }
  return {
    error: `"${key}: ${value}" uses the unit "${unit}", which React Native does not support. Use px, rem or %.`,
  };
}

export default toNativeValue;
