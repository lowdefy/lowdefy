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

// Normalize options config to [{ label, value }] — options can be a list of
// primitives or { label, value } objects, like the antd Selector blocks.
function getOptions(options) {
  return (type.isArray(options) ? options : []).map((option) => {
    if (type.isObject(option)) {
      return {
        label: type.isNone(option.label) ? `${option.value}` : `${option.label}`,
        value: option.value,
      };
    }
    return { label: `${option}`, value: option };
  });
}

export default getOptions;
