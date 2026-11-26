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

// Every container and list row of a context reads one copy of its block config (see Slots), so a
// write into that config would reach all of them. Dev servers and tests freeze the copy, so such a
// write throws where it happens instead.
function freezeConfig({ config }) {
  if (!type.isObject(config) && !type.isArray(config)) return config;
  if (Object.isFrozen(config)) return config;
  Object.freeze(config);
  Object.values(config).forEach((value) => freezeConfig({ config: value }));
  return config;
}

export default freezeConfig;
