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

// Normalize TagSelector / TagMultipleSelector options into a common
// { label, value, color, disabled } shape. Primitives become
// { label: `${value}`, value } so the rest of the pill rendering is uniform.
function getTagSelectorOptions({ options }) {
  return (options ?? []).map((option) =>
    type.isPrimitive(option)
      ? { label: `${option}`, value: option }
      : {
          label: type.isNone(option.label) ? `${option.value}` : option.label,
          value: option.value,
          color: option.color,
          disabled: option.disabled,
        }
  );
}

export default getTagSelectorOptions;
