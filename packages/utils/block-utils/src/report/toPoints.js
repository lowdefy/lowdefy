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

// A CSS length as PostScript points, or undefined when it names no number. A
// number passes through; a string such as '300px' or '12.5' parses its leading
// number. Units are not converted: report sizing treats px and pt as the same
// scale.
function toPoints(value) {
  if (type.isNumber(value)) {
    return Number.isFinite(value) ? value : undefined;
  }
  if (!type.isString(value)) return undefined;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default toPoints;
