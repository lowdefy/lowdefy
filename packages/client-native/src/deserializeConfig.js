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

import { serializer } from '@lowdefy/helpers';

const deserialized = new WeakMap();

// A config as the server sends it (serialized), deserialized once per config object. A host holds
// one object per version of a page, so the page keeps one config object, and its engine context
// can tell a new version from the one it was built from (LowdefyPage), even when the screen
// mounts again.
function deserializeConfig(raw) {
  if (!deserialized.has(raw)) {
    deserialized.set(raw, serializer.deserialize(raw));
  }
  return deserialized.get(raw);
}

export default deserializeConfig;
