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

import { get, type } from '@lowdefy/helpers';

// `hidden` or `disabled` of a button or menu item for one row: the compiled
// `{ when }` condition when there is one, else the ag-grid forms, a literal
// boolean or a `hiddenField` / `disabledField` row path. Only a boolean counts,
// so a disabled that resolves to anything else stays undefined and a
// ConfigProvider's componentDisabled still applies.
function resolveControlFlag({ control, name, compiled, row, value }) {
  if (type.isFunction(compiled)) return compiled(row, value);
  const fieldKey = `${name}Field`;
  const flag = type.isString(control[fieldKey]) ? get(row, control[fieldKey]) : control[name];
  return type.isBoolean(flag) ? flag : undefined;
}

export default resolveControlFlag;
