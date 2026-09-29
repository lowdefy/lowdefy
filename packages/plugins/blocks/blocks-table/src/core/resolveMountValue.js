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

// The value the table mounts with. A value set from outside always wins; a null value (a fresh
// mount) takes the first feature `mountValue` that returns one (the persisted view, then the
// active saved view), else it resolves to the defaults. Reset does not come through here, so it
// always returns to `defaultView`.
function resolveMountValue({ value, config, features, properties }) {
  if (!type.isNone(value)) return value;
  for (const feature of features) {
    const mounted = feature.mountValue?.({ config, properties });
    if (!type.isNone(mounted)) return mounted;
  }
  return value;
}

export default resolveMountValue;
