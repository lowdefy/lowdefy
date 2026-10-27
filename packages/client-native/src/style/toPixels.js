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

const lengthPattern = /^(-?(?:\d+(?:\.\d+)?|\.\d+))(px|em)?$/;

// A CSS length as a number of points: a number as it is, `12px` as 12 and `1.5em` relative to
// `fontSize`, as an em is relative to the text around it on the web. Anything else (a percentage,
// a calc) has no single point value and gives undefined.
function toPixels({ fontSize, value }) {
  if (type.isNumber(value)) {
    return value;
  }
  if (!type.isString(value)) {
    return undefined;
  }
  const match = lengthPattern.exec(value.trim());
  if (match === null) {
    return undefined;
  }
  const amount = Number(match[1]);
  return match[2] === 'em' ? amount * fontSize : amount;
}

export default toPixels;
