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

import expandBorder from './expandBorder.js';
import expandBorderRadius from './expandBorderRadius.js';
import expandBox from './expandBox.js';
import expandFlex from './expandFlex.js';
import expandGap from './expandGap.js';
import getUnsupportedStyleMessage from './getUnsupportedStyleMessage.js';
import toNativeValue from './toNativeValue.js';

const expanders = {
  padding: expandBox,
  margin: expandBox,
  gap: expandGap,
  borderRadius: expandBorderRadius,
  border: expandBorder,
  borderTop: expandBorder,
  borderRight: expandBorder,
  borderBottom: expandBorder,
  borderLeft: expandBorder,
  flex: expandFlex,
};

function convertEntry({ key, value }) {
  const message = getUnsupportedStyleMessage({ key, value });
  if (message) {
    return { error: message };
  }
  // Nested objects and arrays are React Native values (shadowOffset, transform).
  if (value === null || typeof value === 'object') {
    return { style: { [key]: value } };
  }
  if (expanders[key]) {
    return expanders[key]({ key, value });
  }
  const result = toNativeValue({ key, value });
  if (result.error) {
    return { error: result.error };
  }
  return { style: { [key]: result.value } };
}

// Converts one Lowdefy style object (one style slot) to a React Native style
// object. The build runs it on literal styles of mobile pages and fails on
// errors; the shell runs it on styles it gets unconverted (operator results
// and shared pages) and reports errors. Keys starting with "~" are build
// markers and are kept as they are.
function convertStyle(style) {
  const result = {};
  const errors = [];
  Object.entries(style ?? {}).forEach(([key, value]) => {
    if (key.startsWith('~')) {
      result[key] = value;
      return;
    }
    const converted = convertEntry({ key, value });
    if (converted.error) {
      errors.push({ key, message: converted.error });
      return;
    }
    Object.assign(result, converted.style);
  });
  return { style: result, errors };
}

export default convertStyle;
